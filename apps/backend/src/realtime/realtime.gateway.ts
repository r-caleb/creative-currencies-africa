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
      this.logger.log(`Socket connecté: ${client.id} user=${authUser.userId}`);
    } catch (error) {
      this.logger.warn(`Socket refusé: ${error instanceof Error ? error.message : "erreur inconnue"}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Socket déconnecté: ${client.id} user=${client.data?.userId ?? "unknown"}`);
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
}
