import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AddGroupMemberDto } from "./dto/add-group-member.dto";
import { CreateGroupInvitationDto } from "./dto/create-group-invitation.dto";
import { CreateGroupMessageDto } from "./dto/create-group-message.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupMemberCandidateQueryDto } from "./dto/group-member-candidate-query.dto";
import { GroupQueryDto } from "./dto/group-query.dto";
import { ReportGroupMessageDto } from "./dto/report-group-message.dto";
import { ReviewGroupJoinRequestDto } from "./dto/review-group-join-request.dto";
import { UpdateGroupMemberRoleDto } from "./dto/update-group-member-role.dto";
import { UpdateGroupMessageDto } from "./dto/update-group-message.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { GroupService } from "./group.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("groups")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @ApiOperation({ summary: "Lister les groupes communautaires visibles" })
  @ApiOkResponse({ description: "Groupes de discussion de l'espace membre" })
  list(@Req() req: AuthedRequest, @Query() query: GroupQueryDto) {
    return this.groupService.listGroups(req.user, query);
  }

  @Post()
  @ApiOperation({ summary: "Créer un groupe communautaire" })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({ description: "Groupe créé" })
  create(@Req() req: AuthedRequest, @Body() body: CreateGroupDto) {
    return this.groupService.createGroup(req.user, body);
  }

  @Get("invitations")
  @ApiOperation({ summary: "Lister mes invitations de groupes" })
  @ApiOkResponse({ description: "Invitations de groupes en attente" })
  myInvitations(@Req() req: AuthedRequest) {
    return this.groupService.listMyInvitations(req.user);
  }

  @Patch("invitations/:invitationId/accept")
  @ApiOperation({ summary: "Accepter une invitation de groupe" })
  @ApiOkResponse({ description: "Invitation acceptée et adhésion créée" })
  acceptInvitation(@Req() req: AuthedRequest, @Param("invitationId") invitationId: string) {
    return this.groupService.acceptInvitation(req.user, invitationId);
  }

  @Patch("invitations/:invitationId/decline")
  @ApiOperation({ summary: "Refuser une invitation de groupe" })
  @ApiOkResponse({ description: "Invitation refusée" })
  declineInvitation(@Req() req: AuthedRequest, @Param("invitationId") invitationId: string) {
    return this.groupService.declineInvitation(req.user, invitationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulter un groupe communautaire" })
  @ApiOkResponse({ description: "Détail du groupe" })
  detail(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.getGroup(req.user, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Modifier un groupe communautaire" })
  @ApiBody({ type: UpdateGroupDto })
  @ApiOkResponse({ description: "Groupe modifié" })
  update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateGroupDto) {
    return this.groupService.updateGroup(req.user, id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archiver un groupe communautaire" })
  @ApiOkResponse({ description: "Groupe archivé" })
  remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.archiveGroup(req.user, id);
  }

  @Post(":id/join")
  @ApiOperation({ summary: "Rejoindre un groupe" })
  @ApiOkResponse({ description: "Adhésion au groupe mise à jour" })
  join(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.joinGroup(req.user, id);
  }

  @Post(":id/leave")
  @ApiOperation({ summary: "Quitter un groupe" })
  @ApiOkResponse({ description: "Adhésion supprimée" })
  leave(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.leaveGroup(req.user, id);
  }

  @Get(":id/member-candidates")
  @ApiOperation({ summary: "Lister les membres ajoutables dans un groupe" })
  @ApiOkResponse({ description: "Membres actifs qui ne sont pas encore dans le groupe" })
  memberCandidates(@Req() req: AuthedRequest, @Param("id") id: string, @Query() query: GroupMemberCandidateQueryDto) {
    return this.groupService.listMemberCandidates(req.user, id, query);
  }

  @Get(":id/members")
  @ApiOperation({ summary: "Lister les membres d'un groupe" })
  @ApiOkResponse({ description: "Membres et rôles du groupe" })
  members(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.listMembers(req.user, id);
  }

  @Post(":id/members")
  @ApiOperation({ summary: "Ajouter un membre dans un groupe" })
  @ApiBody({ type: AddGroupMemberDto })
  @ApiOkResponse({ description: "Membre ajouté au groupe" })
  addMember(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: AddGroupMemberDto) {
    return this.groupService.addMember(req.user, id, body);
  }

  @Post(":id/photo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 3 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Uploader la photo de profil d'un groupe" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOkResponse({ description: "Photo du groupe mise à jour" })
  uploadGroupPhoto(@Req() req: AuthedRequest, @Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    return this.groupService.uploadGroupPhoto(req.user, id, file);
  }

  @Get(":id/join-requests")
  @ApiOperation({ summary: "Lister les demandes d'accès à un groupe" })
  @ApiOkResponse({ description: "Demandes en attente visibles aux admins du groupe" })
  joinRequests(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.listJoinRequests(req.user, id);
  }

  @Patch(":id/join-requests/:requestId")
  @ApiOperation({ summary: "Accepter ou refuser une demande d'accès à un groupe" })
  @ApiBody({ type: ReviewGroupJoinRequestDto })
  @ApiOkResponse({ description: "Demande d'accès traitée" })
  reviewJoinRequest(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("requestId") requestId: string,
    @Body() body: ReviewGroupJoinRequestDto,
  ) {
    return this.groupService.reviewJoinRequest(req.user, id, requestId, body);
  }

  @Get(":id/invitations")
  @ApiOperation({ summary: "Lister les invitations envoyées pour un groupe" })
  @ApiOkResponse({ description: "Invitations en attente du groupe" })
  groupInvitations(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.listGroupInvitations(req.user, id);
  }

  @Post(":id/invitations")
  @ApiOperation({ summary: "Inviter un membre à rejoindre un groupe" })
  @ApiBody({ type: CreateGroupInvitationDto })
  @ApiCreatedResponse({ description: "Invitation envoyée" })
  inviteMember(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: CreateGroupInvitationDto) {
    return this.groupService.inviteMember(req.user, id, body);
  }

  @Delete(":id/invitations/:invitationId")
  @ApiOperation({ summary: "Annuler une invitation de groupe" })
  @ApiOkResponse({ description: "Invitation annulée" })
  cancelInvitation(@Req() req: AuthedRequest, @Param("id") id: string, @Param("invitationId") invitationId: string) {
    return this.groupService.cancelInvitation(req.user, id, invitationId);
  }

  @Patch(":id/members/:memberUserId")
  @ApiOperation({ summary: "Modifier le rôle d'un membre du groupe" })
  @ApiBody({ type: UpdateGroupMemberRoleDto })
  @ApiOkResponse({ description: "Rôle du membre mis à jour" })
  updateMemberRole(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("memberUserId") memberUserId: string,
    @Body() body: UpdateGroupMemberRoleDto,
  ) {
    return this.groupService.updateMemberRole(req.user, id, memberUserId, body);
  }

  @Delete(":id/members/:memberUserId")
  @ApiOperation({ summary: "Retirer un membre du groupe" })
  @ApiOkResponse({ description: "Membre retiré du groupe" })
  removeMember(@Req() req: AuthedRequest, @Param("id") id: string, @Param("memberUserId") memberUserId: string) {
    return this.groupService.removeMember(req.user, id, memberUserId);
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "Lister les messages d'un groupe" })
  @ApiOkResponse({ description: "Messages de groupe" })
  messages(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.groupService.listMessages(req.user, id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Envoyer un message dans un groupe" })
  @ApiBody({ type: CreateGroupMessageDto })
  @ApiCreatedResponse({ description: "Message créé" })
  createMessage(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: CreateGroupMessageDto) {
    return this.groupService.createMessage(req.user, id, body);
  }

  @Patch(":id/messages/:messageId")
  @ApiOperation({ summary: "Modifier un message de groupe" })
  @ApiBody({ type: UpdateGroupMessageDto })
  @ApiOkResponse({ description: "Message modifié" })
  updateMessage(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
    @Body() body: UpdateGroupMessageDto,
  ) {
    return this.groupService.updateMessage(req.user, id, messageId, body);
  }

  @Delete(":id/messages/:messageId")
  @ApiOperation({ summary: "Supprimer un message de groupe" })
  @ApiOkResponse({ description: "Message supprimé" })
  removeMessage(@Req() req: AuthedRequest, @Param("id") id: string, @Param("messageId") messageId: string) {
    return this.groupService.deleteMessage(req.user, id, messageId);
  }

  @Post(":id/messages/:messageId/reports")
  @ApiOperation({ summary: "Signaler un message de groupe" })
  @ApiBody({ type: ReportGroupMessageDto })
  @ApiCreatedResponse({ description: "Signalement enregistré" })
  reportMessage(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
    @Body() body: ReportGroupMessageDto,
  ) {
    return this.groupService.reportMessage(req.user, id, messageId, body);
  }
}
