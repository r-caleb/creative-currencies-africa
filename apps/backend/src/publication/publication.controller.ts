import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePublicationCommentDto } from "./dto/create-publication-comment.dto";
import { CreatePublicationDto } from "./dto/create-publication.dto";
import { ModeratePublicationReportDto } from "./dto/moderate-publication-report.dto";
import { PublicationQueryDto } from "./dto/publication-query.dto";
import { PublicationReportQueryDto } from "./dto/publication-report-query.dto";
import { ReportPublicationDto } from "./dto/report-publication.dto";
import { SharePublicationDto } from "./dto/share-publication.dto";
import { TogglePublicationReactionDto } from "./dto/toggle-publication-reaction.dto";
import { UpdatePublicationDto } from "./dto/update-publication.dto";
import { PublicationService } from "./publication.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("publications")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get("capabilities")
  @ApiOperation({ summary: "Lister ce que le membre connecté peut publier" })
  @ApiOkResponse({ description: "Types de publications autorisés selon le type de compte" })
  capabilities(@Req() req: AuthedRequest) {
    return this.publicationService.getCapabilities(req.user);
  }

  @Post()
  @ApiOperation({ summary: "Créer une publication dans le hub CCA" })
  @ApiBody({ type: CreatePublicationDto })
  @ApiCreatedResponse({ description: "Publication créée" })
  create(@Req() req: AuthedRequest, @Body() body: CreatePublicationDto) {
    return this.publicationService.createPublication(req.user, body);
  }

  @Post("uploads")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Uploader un fichier ou une image avant publication" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiCreatedResponse({ description: "Fichier de publication uploadé" })
  upload(@Req() req: AuthedRequest, @UploadedFile() file?: Express.Multer.File) {
    return this.publicationService.uploadPublicationAttachment(req.user, file);
  }

  @Get()
  @ApiOperation({ summary: "Lister les publications visibles" })
  @ApiOkResponse({ description: "Flux de publications du réseau CCA" })
  list(@Req() req: AuthedRequest, @Query() query: PublicationQueryDto) {
    return this.publicationService.listPublications(req.user, query);
  }

  @Get("mine")
  @ApiOperation({ summary: "Lister mes publications, brouillons inclus" })
  @ApiOkResponse({ description: "Publications du membre connecté" })
  mine(@Req() req: AuthedRequest, @Query() query: PublicationQueryDto) {
    return this.publicationService.listMyPublications(req.user, query);
  }

  @Get("reports")
  @ApiOperation({ summary: "Lister les signalements de publications à modérer" })
  @ApiOkResponse({ description: "Signalements réservés aux administrateurs" })
  reports(@Req() req: AuthedRequest, @Query() query: PublicationReportQueryDto) {
    return this.publicationService.listPublicationReports(req.user, query);
  }

  @Patch("reports/:reportId")
  @ApiOperation({ summary: "Traiter un signalement de publication" })
  @ApiBody({ type: ModeratePublicationReportDto })
  @ApiOkResponse({ description: "Signalement traité" })
  moderateReport(@Req() req: AuthedRequest, @Param("reportId") reportId: string, @Body() body: ModeratePublicationReportDto) {
    return this.publicationService.moderatePublicationReport(req.user, reportId, body);
  }

  @Get(":id/comments")
  @ApiOperation({ summary: "Lister les commentaires d'une publication" })
  @ApiOkResponse({ description: "Commentaires visibles de la publication" })
  comments(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.publicationService.listComments(req.user, id);
  }

  @Get(":id/reactions")
  @ApiOperation({ summary: "Lister les membres qui ont aimé une publication" })
  @ApiOkResponse({ description: "Réactions visibles par l'auteur de la publication" })
  reactions(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.publicationService.listReactions(req.user, id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulter une publication" })
  @ApiOkResponse({ description: "Publication détaillée" })
  detail(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.publicationService.getPublication(req.user, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Modifier une publication" })
  @ApiBody({ type: UpdatePublicationDto })
  @ApiOkResponse({ description: "Publication modifiée" })
  update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdatePublicationDto) {
    return this.publicationService.updatePublication(req.user, id, body);
  }

  @Post(":id/publish")
  @ApiOperation({ summary: "Publier un brouillon" })
  @ApiOkResponse({ description: "Publication publiée" })
  publish(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.publicationService.publishPublication(req.user, id);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiver une publication" })
  @ApiOkResponse({ description: "Publication archivée" })
  archive(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.publicationService.archivePublication(req.user, id);
  }

  @Post(":id/comments")
  @ApiOperation({ summary: "Commenter une publication" })
  @ApiBody({ type: CreatePublicationCommentDto })
  @ApiCreatedResponse({ description: "Commentaire créé" })
  comment(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: CreatePublicationCommentDto) {
    return this.publicationService.addComment(req.user, id, body);
  }

  @Delete(":id/comments/:commentId")
  @ApiOperation({ summary: "Supprimer un commentaire" })
  @ApiOkResponse({ description: "Commentaire supprimé" })
  deleteComment(@Req() req: AuthedRequest, @Param("id") id: string, @Param("commentId") commentId: string) {
    return this.publicationService.deleteComment(req.user, id, commentId);
  }

  @Post(":id/reactions")
  @ApiOperation({ summary: "Aimer, soutenir ou sauvegarder une publication" })
  @ApiBody({ type: TogglePublicationReactionDto })
  @ApiOkResponse({ description: "Réaction mise à jour" })
  react(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: TogglePublicationReactionDto) {
    return this.publicationService.toggleReaction(req.user, id, body);
  }

  @Post(":id/shares")
  @ApiOperation({ summary: "Partager une publication" })
  @ApiBody({ type: SharePublicationDto })
  @ApiOkResponse({ description: "Publication partagée" })
  share(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: SharePublicationDto) {
    return this.publicationService.sharePublication(req.user, id, body);
  }

  @Post(":id/reports")
  @ApiOperation({ summary: "Signaler une publication" })
  @ApiBody({ type: ReportPublicationDto })
  @ApiCreatedResponse({ description: "Signalement enregistré" })
  report(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: ReportPublicationDto) {
    return this.publicationService.reportPublication(req.user, id, body);
  }
}
