import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BlockUserDto } from "./dto/block-user.dto";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
import { ModerateDirectMessageReportDto } from "./dto/moderate-direct-message-report.dto";
import { MessageSearchQueryDto } from "./dto/message-search-query.dto";
import { ReportDirectMessageDto } from "./dto/report-direct-message.dto";
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

  @Get("reports")
  @ApiOperation({ summary: "Lister les signalements de messages privés à modérer" })
  @ApiOkResponse({ description: "Signalements réservés aux administrateurs" })
  listReports(@Req() req: AuthedRequest) {
    return this.messages.listMessageReports(req.user);
  }

  @Patch("reports/:reportId")
  @ApiOperation({ summary: "Traiter un signalement de message privé" })
  @ApiBody({ type: ModerateDirectMessageReportDto })
  @ApiOkResponse({ description: "Signalement traité" })
  moderateReport(@Req() req: AuthedRequest, @Param("reportId") reportId: string, @Body() body: ModerateDirectMessageReportDto) {
    return this.messages.moderateMessageReport(req.user, reportId, body);
  }

  @Post("blocks/:userId")
  @ApiOperation({ summary: "Bloquer un membre dans la messagerie" })
  @ApiBody({ type: BlockUserDto })
  @ApiOkResponse({ description: "Membre bloqué" })
  blockUser(@Req() req: AuthedRequest, @Param("userId") userId: string, @Body() body: BlockUserDto) {
    return this.messages.blockUser(req.user, userId, body);
  }

  @Get("conversations")
  @ApiOperation({ summary: "Lister mes conversations privées" })
  @ApiOkResponse({ description: "Conversations privées du membre connecté" })
  listConversations(@Req() req: AuthedRequest) {
    return this.messages.listConversations(req.user);
  }

  @Get("conversations/archived")
  @ApiOperation({ summary: "Lister mes conversations privées archivées" })
  @ApiOkResponse({ description: "Conversations privées archivées du membre connecté" })
  listArchivedConversations(@Req() req: AuthedRequest) {
    return this.messages.listArchivedConversations(req.user);
  }

  @Get("search")
  @ApiOperation({ summary: "Rechercher dans mes messages privés" })
  @ApiOkResponse({ description: "Messages privés correspondant à la recherche" })
  searchMessages(@Req() req: AuthedRequest, @Query() query: MessageSearchQueryDto) {
    return this.messages.searchMessages(req.user, query);
  }

  @Post("conversations")
  @ApiOperation({ summary: "Créer ou ouvrir une conversation privée" })
  @ApiBody({ type: CreateDirectConversationDto })
  @ApiCreatedResponse({ description: "Conversation privée prête" })
  createConversation(@Req() req: AuthedRequest, @Body() body: CreateDirectConversationDto) {
    return this.messages.createConversation(req.user, body);
  }

  @Post("uploads")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Uploader une pièce jointe de message" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @ApiCreatedResponse({ description: "Pièce jointe prête à être envoyée dans une conversation" })
  uploadAttachment(@Req() req: AuthedRequest, @UploadedFile() file?: Express.Multer.File) {
    return this.messages.uploadMessageAttachment(req.user, file);
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

  @Get("conversations/:id/attachments")
  @ApiOperation({ summary: "Lister les pièces jointes d'une conversation privée" })
  @ApiOkResponse({ description: "Images et fichiers échangés dans la conversation" })
  listConversationAttachments(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.messages.listConversationAttachments(req.user, id);
  }

  @Patch("conversations/:id/archive")
  @ApiOperation({ summary: "Archiver une conversation privée pour moi" })
  @ApiOkResponse({ description: "Conversation archivée" })
  archiveConversation(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.messages.archiveConversation(req.user, id);
  }

  @Patch("conversations/:id/unarchive")
  @ApiOperation({ summary: "Restaurer une conversation privée archivée" })
  @ApiOkResponse({ description: "Conversation restaurée" })
  unarchiveConversation(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.messages.unarchiveConversation(req.user, id);
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

  @Post("conversations/:id/messages/:messageId/reports")
  @ApiOperation({ summary: "Signaler un message privé" })
  @ApiBody({ type: ReportDirectMessageDto })
  @ApiCreatedResponse({ description: "Signalement enregistré" })
  reportMessage(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
    @Body() body: ReportDirectMessageDto,
  ) {
    return this.messages.reportMessage(req.user, id, messageId, body);
  }
}
