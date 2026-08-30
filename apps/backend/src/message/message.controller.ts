import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
import { UpdateDirectMessageDto } from "./dto/update-direct-message.dto";
import { MessageService } from "./message.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("messages")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messages: MessageService) {}

  @Get("unread-count")
  @ApiOperation({ summary: "Compter mes messages non lus" })
  @ApiOkResponse({ description: "Nombre total de messages non lus" })
  getUnreadCount(@Req() req: AuthedRequest) {
    return this.messages.getUnreadCount(req.user);
  }

  @Get("conversations")
  @ApiOperation({ summary: "Lister mes conversations privées" })
  @ApiOkResponse({ description: "Conversations privées du membre connecté" })
  listConversations(@Req() req: AuthedRequest) {
    return this.messages.listConversations(req.user);
  }

  @Post("conversations")
  @ApiOperation({ summary: "Créer ou ouvrir une conversation privée" })
  @ApiBody({ type: CreateDirectConversationDto })
  @ApiCreatedResponse({ description: "Conversation privée prête" })
  createConversation(@Req() req: AuthedRequest, @Body() body: CreateDirectConversationDto) {
    return this.messages.createConversation(req.user, body);
  }

  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "Lister les messages d'une conversation privée" })
  @ApiOkResponse({ description: "Messages privés" })
  listMessages(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.messages.listMessages(req.user, id);
  }

  @Patch("conversations/:id/read")
  @ApiOperation({ summary: "Marquer une conversation privée comme lue" })
  @ApiOkResponse({ description: "Conversation marquée comme lue" })
  markConversationRead(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.messages.markConversationRead(req.user, id);
  }

  @Post("conversations/:id/messages")
  @ApiOperation({ summary: "Envoyer un message privé" })
  @ApiBody({ type: CreateDirectMessageDto })
  @ApiCreatedResponse({ description: "Message envoyé" })
  createMessage(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: CreateDirectMessageDto) {
    return this.messages.createMessage(req.user, id, body);
  }

  @Patch("conversations/:id/messages/:messageId")
  @ApiOperation({ summary: "Modifier un message privé" })
  @ApiBody({ type: UpdateDirectMessageDto })
  @ApiOkResponse({ description: "Message privé modifié" })
  updateMessage(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
    @Body() body: UpdateDirectMessageDto,
  ) {
    return this.messages.updateMessage(req.user, id, messageId, body);
  }

  @Delete("conversations/:id/messages/:messageId")
  @ApiOperation({ summary: "Supprimer un message privé" })
  @ApiOkResponse({ description: "Message privé supprimé" })
  deleteMessage(@Req() req: AuthedRequest, @Param("id") id: string, @Param("messageId") messageId: string) {
    return this.messages.deleteMessage(req.user, id, messageId);
  }
}
