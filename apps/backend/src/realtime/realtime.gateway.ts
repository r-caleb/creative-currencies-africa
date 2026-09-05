import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthUserService } from "../auth/auth-user.service";
import { PrismaService } from "../prisma/prisma.service";

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
    email?: string;
    connectedAt?: string;
  };
};

type RealtimePayload = Record<string, unknown>;

@Injectable()
@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ["websocket", "polling"],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly authUsers: AuthUserService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      const authUser = await this.authUsers.getActiveAuthUserOrThrow(payload.sub);

      client.data.userId = authUser.userId;
      client.data.email = authUser.email;
      client.data.connectedAt = new Date().toISOString();

      await client.join(this.userRoom(authUser.userId));
      this.registerPresence(authUser.userId, client.id);
      client.emit("presence.snapshot", { onlineUserIds: this.onlineUserIds() });
      this.server?.emit("presence.updated", { userId: authUser.userId, online: true });
      this.logger.log(`Socket connecté: ${client.id} user=${authUser.userId}`);
    } catch (error) {
      this.logger.warn(`Socket refusé: ${error instanceof Error ? error.message : "erreur inconnue"}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data?.userId;

    if (userId && this.unregisterPresence(userId, client.id)) {
      this.server?.emit("presence.updated", { userId, online: false });
    }

    this.logger.log(`Socket déconnecté: ${client.id} user=${client.data?.userId ?? "unknown"}`);
  }

  @SubscribeMessage("direct.typing")
  async directTyping(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { conversationId?: string; isTyping?: boolean }) {
    const userId = client.data?.userId;
    const conversationId = body?.conversationId?.trim();

    if (!userId || !conversationId) {
      return { ok: false };
    }

    const participant = await this.prisma.directConversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });

    if (!participant) {
      return { ok: false };
    }

    client.to(this.directConversationRoom(conversationId)).emit("direct.typing", {
      conversationId,
      userId,
      isTyping: Boolean(body?.isTyping),
    });

    return { ok: true, conversationId };
  }

  @SubscribeMessage("group.typing")
  async groupTyping(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { groupId?: string; isTyping?: boolean }) {
    const userId = client.data?.userId;
    const groupId = body?.groupId?.trim();

    if (!userId || !groupId) {
      return { ok: false };
    }

    const membership = await this.prisma.communityGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    });

    if (!membership) {
      return { ok: false };
    }

    client.to(this.groupRoom(groupId)).emit("group.typing", {
      groupId,
      userId,
      isTyping: Boolean(body?.isTyping),
    });

    return { ok: true, groupId };
  }

  @SubscribeMessage("group.join")
  async joinGroup(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { groupId?: string }) {
    const userId = client.data?.userId;
    const groupId = body?.groupId?.trim();

    if (!userId || !groupId) {
      return { ok: false };
    }

    const membership = await this.prisma.communityGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    });

    if (!membership) {
      return { ok: false };
    }

    await client.join(this.groupRoom(groupId));
    return { ok: true, groupId };
  }

  @SubscribeMessage("group.leave")
  async leaveGroup(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { groupId?: string }) {
    const groupId = body?.groupId?.trim();

    if (!groupId) {
      return { ok: false };
    }

    await client.leave(this.groupRoom(groupId));
    return { ok: true, groupId };
  }

  @SubscribeMessage("direct.join")
  async joinDirectConversation(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { conversationId?: string }) {
    const userId = client.data?.userId;
    const conversationId = body?.conversationId?.trim();

    if (!userId || !conversationId) {
      return { ok: false };
    }

    const participant = await this.prisma.directConversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });

    if (!participant) {
      return { ok: false };
    }

    await client.join(this.directConversationRoom(conversationId));
    return { ok: true, conversationId };
  }

  @SubscribeMessage("direct.leave")
  async leaveDirectConversation(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() body: { conversationId?: string }) {
    const conversationId = body?.conversationId?.trim();

    if (!conversationId) {
      return { ok: false };
    }

    await client.leave(this.directConversationRoom(conversationId));
    return { ok: true, conversationId };
  }

  emitToUser(userId: string, event: string, payload: RealtimePayload) {
    this.server?.to(this.userRoom(userId)).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: RealtimePayload) {
    for (const userId of [...new Set(userIds.filter(Boolean))]) {
      this.emitToUser(userId, event, payload);
    }
  }

  emitToGroup(groupId: string, event: string, payload: RealtimePayload) {
    this.server?.to(this.groupRoom(groupId)).emit(event, payload);
  }

  emitToDirectConversation(conversationId: string, event: string, payload: RealtimePayload) {
    this.server?.to(this.directConversationRoom(conversationId)).emit(event, payload);
  }

  emitDirectConversationRead(conversationId: string, userId: string, readAt: Date) {
    this.emitToDirectConversation(conversationId, "direct.conversation.read", {
      conversationId,
      userId,
      readAt,
    });
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private groupRoom(groupId: string) {
    return `group:${groupId}`;
  }

  private directConversationRoom(conversationId: string) {
    return `direct:${conversationId}`;
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === "string" && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
      return authorization.slice(7).trim();
    }

    return null;
  }

  private registerPresence(userId: string, socketId: string) {
    const sockets = this.connectedUsers.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.connectedUsers.set(userId, sockets);
  }

  private unregisterPresence(userId: string, socketId: string) {
    const sockets = this.connectedUsers.get(userId);

    if (!sockets) {
      return false;
    }

    sockets.delete(socketId);

    if (sockets.size) {
      return false;
    }

    this.connectedUsers.delete(userId);
    return true;
  }

  private onlineUserIds() {
    return Array.from(this.connectedUsers.keys());
  }
}
