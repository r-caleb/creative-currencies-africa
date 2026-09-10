import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateDisciplineDto } from "../reference/dto/create-discipline.dto";
import { UpdateDisciplineDto } from "../reference/dto/update-discipline.dto";
import { AdminService } from "./admin.service";
import { CreateAdminEventDto } from "./dto/create-admin-event.dto";
import { CreateAdminOpportunityDto } from "./dto/create-admin-opportunity.dto";
import { CreateAdminResourceDto } from "./dto/create-admin-resource.dto";
import { CreateAdminTrainingDto } from "./dto/create-admin-training.dto";
import { CreateGalleryAlbumDto } from "./dto/create-gallery-album.dto";
import { CreateGalleryPhotoDto } from "./dto/create-gallery-photo.dto";
import { ListAdminContentQueryDto } from "./dto/list-admin-content.query.dto";
import { ListAdminAuditLogQueryDto } from "./dto/list-admin-audit-log-query.dto";
import { ListAdminMessageReportsQueryDto, ListAdminModerationQueryDto } from "./dto/list-admin-moderation-query.dto";
import { ListAdminOpportunityQueryDto } from "./dto/list-admin-opportunity.query.dto";
import { ListAccountEvolutionRequestsQueryDto } from "./dto/list-account-evolution-requests.query.dto";
import { ListOpportunityApplicationsQueryDto } from "./dto/list-opportunity-applications.query.dto";
import { ListGalleryAlbumQueryDto } from "./dto/list-gallery-album.query.dto";
import { ListTrainingEnrollmentsQueryDto } from "./dto/list-training-enrollments.query.dto";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { ListAdminReferenceQueryDto } from "./dto/list-admin-reference.query.dto";
import { ListAdminResourceQueryDto } from "./dto/list-admin-resource.query.dto";
import { UpdateAdminEventDto } from "./dto/update-admin-event.dto";
import { UpdateAdminMessageReportDto } from "./dto/update-admin-message-report.dto";
import { UpdateAdminOpportunityDto } from "./dto/update-admin-opportunity.dto";
import { UpdateAdminResourceDto } from "./dto/update-admin-resource.dto";
import { UpdateAdminTrainingDto } from "./dto/update-admin-training.dto";
import { UpdatePlatformProfileDto } from "./dto/update-platform-profile.dto";
import { UpdateGalleryAlbumDto } from "./dto/update-gallery-album.dto";
import { UpdateGalleryPhotoDto } from "./dto/update-gallery-photo.dto";
import { UpdateAccountEvolutionRequestDto } from "./dto/update-account-evolution-request.dto";
import { UpdateOpportunityApplicationDto } from "./dto/update-opportunity-application.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { UpdateTrainingEnrollmentDto } from "./dto/update-training-enrollment.dto";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("admin")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("overview")
  @ApiOperation({ summary: "Vue d'ensemble du back-office CCA" })
  @ApiOkResponse({ description: "Indicateurs et files d'action réservés aux administrateurs" })
  overview(@Req() req: AuthedRequest) {
    return this.adminService.overview(req.user);
  }

  @Post("uploads")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Uploader un fichier depuis le back-office" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        purpose: {
          type: "string",
          enum: ["training", "event", "gallery", "resource", "opportunity", "partner", "certificate", "platform"],
          default: "resource",
        },
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @ApiCreatedResponse({ description: "Fichier uploadé et prêt à être utilisé dans un formulaire admin" })
  upload(@Req() req: AuthedRequest, @Body("purpose") purpose: string | undefined, @UploadedFile() file?: Express.Multer.File) {
    return this.adminService.uploadAdminAsset(req.user, purpose, file);
  }

  @Get("platform-profile")
  @ApiOperation({ summary: "Afficher le profil officiel public CCA" })
  @ApiOkResponse({ description: "Identité publique utilisée par les contenus officiels CCA" })
  platformProfile(@Req() req: AuthedRequest) {
    return this.adminService.getPlatformProfile(req.user);
  }

  @Patch("platform-profile")
  @ApiOperation({ summary: "Modifier le profil officiel public CCA" })
  @ApiBody({ type: UpdatePlatformProfileDto })
  @ApiOkResponse({ description: "Profil officiel CCA mis à jour" })
  updatePlatformProfile(@Req() req: AuthedRequest, @Body() body: UpdatePlatformProfileDto) {
    return this.adminService.updatePlatformProfile(req.user, body);
  }

  @Get("members")
  @ApiOperation({ summary: "Lister les comptes membres pour l'équipe CCA" })
  @ApiOkResponse({ description: "Comptes filtrés par statut, type ou recherche" })
  members(@Req() req: AuthedRequest, @Query() query: Record<string, string | undefined>) {
    return this.adminService.listMembers(req.user, query);
  }

  @Patch("members/:id/status")
  @ApiOperation({ summary: "Modifier le statut d'un compte membre" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"] },
      },
      required: ["status"],
    },
  })
  @ApiOkResponse({ description: "Compte mis à jour" })
  updateMemberStatus(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: { status?: string }) {
    return this.adminService.updateMemberStatus(req.user, id, body);
  }

  @Patch("members/:id/admin-access")
  @ApiOperation({ summary: "Donner un accès administrateur à un compte membre" })
  @ApiOkResponse({ description: "Compte promu administrateur" })
  grantAdminAccess(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.grantAdminAccess(req.user, id);
  }

  @Patch("members/:id/verification")
  @ApiOperation({ summary: "Valider ou retirer la vérification officielle d'un profil" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        verified: { type: "boolean" },
      },
      required: ["verified"],
    },
  })
  @ApiOkResponse({ description: "Vérification du profil mise à jour" })
  updateMemberVerification(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: { verified?: boolean }) {
    return this.adminService.updateMemberVerification(req.user, id, body);
  }

  @Get("account-evolution-requests")
  @ApiOperation({ summary: "Lister les demandes d'évolution de parcours membre" })
  @ApiOkResponse({ description: "Demandes public/apprenant vers créateur à traiter par CCA" })
  accountEvolutionRequests(@Req() req: AuthedRequest, @Query() query: ListAccountEvolutionRequestsQueryDto) {
    return this.adminService.listAccountEvolutionRequests(req.user, query);
  }

  @Patch("account-evolution-requests/:id")
  @ApiOperation({ summary: "Accepter ou refuser une demande d'évolution de parcours" })
  @ApiBody({ type: UpdateAccountEvolutionRequestDto })
  @ApiOkResponse({ description: "Demande de parcours traitée" })
  updateAccountEvolutionRequest(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAccountEvolutionRequestDto) {
    return this.adminService.updateAccountEvolutionRequest(req.user, id, body);
  }

  @Get("publications")
  @ApiOperation({ summary: "Lister les publications pour modération et pilotage" })
  @ApiOkResponse({ description: "Publications filtrées par statut, type ou recherche" })
  publications(@Req() req: AuthedRequest, @Query() query: Record<string, string | undefined>) {
    return this.adminService.listPublications(req.user, query);
  }

  @Patch("publications/:id/status")
  @ApiOperation({ summary: "Modifier le statut d'une publication" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["PUBLISHED", "ARCHIVED", "REJECTED"] },
      },
      required: ["status"],
    },
  })
  @ApiOkResponse({ description: "Publication mise à jour" })
  updatePublicationStatus(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: { status?: string }) {
    return this.adminService.updatePublicationStatus(req.user, id, body);
  }

  @Get("reports")
  @ApiOperation({ summary: "Lister les signalements à traiter" })
  @ApiOkResponse({ description: "Signalements de publications pour la modération" })
  reports(@Req() req: AuthedRequest, @Query() query: ListAdminModerationQueryDto) {
    return this.adminService.listReports(req.user, query);
  }

  @Patch("reports/:id")
  @ApiOperation({ summary: "Traiter un signalement" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["REVIEWED", "DISMISSED"] },
        publicationStatus: { type: "string", enum: ["PUBLISHED", "ARCHIVED", "REJECTED"] },
      },
    },
  })
  @ApiOkResponse({ description: "Signalement traité" })
  updateReport(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: { status?: string; publicationStatus?: string }) {
    return this.adminService.updateReport(req.user, id, body);
  }

  @Get("message-reports")
  @ApiOperation({ summary: "Lister les signalements de messages privés" })
  @ApiOkResponse({ description: "Signalements de messages privés pour l'équipe de modération" })
  messageReports(@Req() req: AuthedRequest, @Query() query: ListAdminMessageReportsQueryDto) {
    return this.adminService.listMessageReports(req.user, query);
  }

  @Patch("message-reports/:id")
  @ApiOperation({ summary: "Traiter un signalement de message privé" })
  @ApiBody({ type: UpdateAdminMessageReportDto })
  @ApiOkResponse({ description: "Signalement de message traité" })
  updateMessageReport(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminMessageReportDto) {
    return this.adminService.updateMessageReport(req.user, id, body);
  }

  @Get("group-message-reports")
  @ApiOperation({ summary: "Lister les signalements de messages de groupe" })
  @ApiOkResponse({ description: "Signalements de messages de groupe pour l'équipe de modération" })
  groupMessageReports(@Req() req: AuthedRequest, @Query() query: ListAdminMessageReportsQueryDto) {
    return this.adminService.listGroupMessageReports(req.user, query);
  }

  @Patch("group-message-reports/:id")
  @ApiOperation({ summary: "Traiter un signalement de message de groupe" })
  @ApiBody({ type: UpdateAdminMessageReportDto })
  @ApiOkResponse({ description: "Signalement de message de groupe traité" })
  updateGroupMessageReport(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminMessageReportDto) {
    return this.adminService.updateGroupMessageReport(req.user, id, body);
  }

  @Get("audit-logs")
  @ApiOperation({ summary: "Lister l'historique des actions admin" })
  @ApiOkResponse({ description: "Journal des actions sensibles réalisées dans le back-office" })
  auditLogs(@Req() req: AuthedRequest, @Query() query: ListAdminAuditLogQueryDto) {
    return this.adminService.listAuditLogs(req.user, query);
  }

  @Get("risk-users")
  @ApiOperation({ summary: "Lister les comptes signalés plusieurs fois" })
  @ApiOkResponse({ description: "Synthèse des utilisateurs les plus signalés" })
  riskUsers(@Req() req: AuthedRequest) {
    return this.adminService.listRiskUsers(req.user);
  }

  @Get("trainings")
  @ApiOperation({ summary: "Lister les formations du back-office" })
  @ApiOkResponse({ description: "Formations filtrées par recherche ou statut" })
  trainings(@Req() req: AuthedRequest, @Query() query: ListAdminContentQueryDto) {
    return this.adminService.listTrainings(req.user, query);
  }

  @Post("trainings")
  @ApiOperation({ summary: "Créer une formation ou un workshop" })
  @ApiBody({ type: CreateAdminTrainingDto })
  @ApiCreatedResponse({ description: "Formation créée" })
  createTraining(@Req() req: AuthedRequest, @Body() body: CreateAdminTrainingDto) {
    return this.adminService.createTraining(req.user, body);
  }

  @Patch("trainings/:id")
  @ApiOperation({ summary: "Modifier une formation ou un workshop" })
  @ApiBody({ type: UpdateAdminTrainingDto })
  @ApiOkResponse({ description: "Formation mise à jour" })
  updateTraining(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminTrainingDto) {
    return this.adminService.updateTraining(req.user, id, body);
  }

  @Delete("trainings/:id")
  @ApiOperation({ summary: "Supprimer une formation ou un workshop" })
  @ApiOkResponse({ description: "Formation supprimée" })
  deleteTraining(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteTraining(req.user, id);
  }

  @Get("training-enrollments")
  @ApiOperation({ summary: "Lister les inscriptions aux formations" })
  @ApiOkResponse({ description: "Inscriptions filtrées par formation, statut ou recherche" })
  trainingEnrollments(@Req() req: AuthedRequest, @Query() query: ListTrainingEnrollmentsQueryDto) {
    return this.adminService.listTrainingEnrollments(req.user, query);
  }

  @Get("training-enrollments/export.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=\"inscriptions-formations-cca.csv\"")
  @ApiOperation({ summary: "Exporter les inscriptions aux formations en CSV" })
  @ApiOkResponse({ description: "Fichier CSV des inscriptions filtrées" })
  exportTrainingEnrollments(@Req() req: AuthedRequest, @Query() query: ListTrainingEnrollmentsQueryDto) {
    return this.adminService.exportTrainingEnrollmentsCsv(req.user, query);
  }

  @Patch("training-enrollments/:id")
  @ApiOperation({ summary: "Mettre à jour le statut d'une inscription formation" })
  @ApiBody({ type: UpdateTrainingEnrollmentDto })
  @ApiOkResponse({ description: "Inscription mise à jour et notification envoyée si le statut change" })
  updateTrainingEnrollment(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateTrainingEnrollmentDto) {
    return this.adminService.updateTrainingEnrollment(req.user, id, body);
  }

  @Get("events")
  @ApiOperation({ summary: "Lister les événements officiels du back-office" })
  @ApiOkResponse({ description: "Événements filtrés par recherche, type ou publication" })
  events(@Req() req: AuthedRequest, @Query() query: ListAdminContentQueryDto) {
    return this.adminService.listEvents(req.user, query);
  }

  @Post("events")
  @ApiOperation({ summary: "Créer un événement officiel" })
  @ApiBody({ type: CreateAdminEventDto })
  @ApiCreatedResponse({ description: "Événement créé" })
  createEvent(@Req() req: AuthedRequest, @Body() body: CreateAdminEventDto) {
    return this.adminService.createEvent(req.user, body);
  }

  @Patch("events/:id")
  @ApiOperation({ summary: "Modifier un événement officiel" })
  @ApiBody({ type: UpdateAdminEventDto })
  @ApiOkResponse({ description: "Événement mis à jour" })
  updateEvent(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminEventDto) {
    return this.adminService.updateEvent(req.user, id, body);
  }

  @Delete("events/:id")
  @ApiOperation({ summary: "Supprimer un événement officiel" })
  @ApiOkResponse({ description: "Événement supprimé" })
  deleteEvent(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteEvent(req.user, id);
  }

  @Get("resources")
  @ApiOperation({ summary: "Lister les ressources du back-office" })
  @ApiOkResponse({ description: "Ressources filtrées par type, accès ou publication" })
  resources(@Req() req: AuthedRequest, @Query() query: ListAdminResourceQueryDto) {
    return this.adminService.listResources(req.user, query);
  }

  @Post("resources")
  @ApiOperation({ summary: "Créer une ressource documentaire" })
  @ApiBody({ type: CreateAdminResourceDto })
  @ApiCreatedResponse({ description: "Ressource créée" })
  createResource(@Req() req: AuthedRequest, @Body() body: CreateAdminResourceDto) {
    return this.adminService.createResource(req.user, body);
  }

  @Patch("resources/:id")
  @ApiOperation({ summary: "Modifier une ressource documentaire" })
  @ApiBody({ type: UpdateAdminResourceDto })
  @ApiOkResponse({ description: "Ressource mise à jour" })
  updateResource(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminResourceDto) {
    return this.adminService.updateResource(req.user, id, body);
  }

  @Delete("resources/:id")
  @ApiOperation({ summary: "Supprimer une ressource documentaire" })
  @ApiOkResponse({ description: "Ressource supprimée" })
  deleteResource(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteResource(req.user, id);
  }

  @Get("opportunities")
  @ApiOperation({ summary: "Lister les opportunités du back-office" })
  @ApiOkResponse({ description: "Opportunités filtrées par type, statut ou publication" })
  opportunities(@Req() req: AuthedRequest, @Query() query: ListAdminOpportunityQueryDto) {
    return this.adminService.listOpportunities(req.user, query);
  }

  @Post("opportunities")
  @ApiOperation({ summary: "Créer une opportunité" })
  @ApiBody({ type: CreateAdminOpportunityDto })
  @ApiCreatedResponse({ description: "Opportunité créée" })
  createOpportunity(@Req() req: AuthedRequest, @Body() body: CreateAdminOpportunityDto) {
    return this.adminService.createOpportunity(req.user, body);
  }

  @Patch("opportunities/:id")
  @ApiOperation({ summary: "Modifier une opportunité" })
  @ApiBody({ type: UpdateAdminOpportunityDto })
  @ApiOkResponse({ description: "Opportunité mise à jour" })
  updateOpportunity(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateAdminOpportunityDto) {
    return this.adminService.updateOpportunity(req.user, id, body);
  }

  @Delete("opportunities/:id")
  @ApiOperation({ summary: "Supprimer une opportunité" })
  @ApiOkResponse({ description: "Opportunité supprimée" })
  deleteOpportunity(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteOpportunity(req.user, id);
  }

  @Get("opportunity-applications")
  @ApiOperation({ summary: "Lister les candidatures aux opportunités" })
  @ApiOkResponse({ description: "Candidatures filtrées par opportunité, statut, discipline, ville ou recherche" })
  opportunityApplications(@Req() req: AuthedRequest, @Query() query: ListOpportunityApplicationsQueryDto) {
    return this.adminService.listOpportunityApplications(req.user, query);
  }

  @Get("opportunity-applications/export.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=\"candidatures-opportunites-cca.csv\"")
  @ApiOperation({ summary: "Exporter les candidatures aux opportunités en CSV" })
  @ApiOkResponse({ description: "Fichier CSV des candidatures filtrées" })
  exportOpportunityApplications(@Req() req: AuthedRequest, @Query() query: ListOpportunityApplicationsQueryDto) {
    return this.adminService.exportOpportunityApplicationsCsv(req.user, query);
  }

  @Patch("opportunity-applications/:id")
  @ApiOperation({ summary: "Mettre à jour le statut d'une candidature" })
  @ApiBody({ type: UpdateOpportunityApplicationDto })
  @ApiOkResponse({ description: "Candidature mise à jour et notification envoyée si le statut change" })
  updateOpportunityApplication(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateOpportunityApplicationDto) {
    return this.adminService.updateOpportunityApplication(req.user, id, body);
  }

  @Get("gallery/albums")
  @ApiOperation({ summary: "Lister les albums de la galerie officielle" })
  @ApiOkResponse({ description: "Albums filtrés par catégorie, statut ou recherche" })
  galleryAlbums(@Req() req: AuthedRequest, @Query() query: ListGalleryAlbumQueryDto) {
    return this.adminService.listGalleryAlbums(req.user, query);
  }

  @Post("gallery/albums")
  @ApiOperation({ summary: "Créer un album de galerie officielle" })
  @ApiBody({ type: CreateGalleryAlbumDto })
  @ApiCreatedResponse({ description: "Album créé" })
  createGalleryAlbum(@Req() req: AuthedRequest, @Body() body: CreateGalleryAlbumDto) {
    return this.adminService.createGalleryAlbum(req.user, body);
  }

  @Patch("gallery/albums/:id")
  @ApiOperation({ summary: "Modifier un album de galerie officielle" })
  @ApiBody({ type: UpdateGalleryAlbumDto })
  @ApiOkResponse({ description: "Album mis à jour" })
  updateGalleryAlbum(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateGalleryAlbumDto) {
    return this.adminService.updateGalleryAlbum(req.user, id, body);
  }

  @Delete("gallery/albums/:id")
  @ApiOperation({ summary: "Supprimer un album de galerie officielle" })
  @ApiOkResponse({ description: "Album supprimé" })
  deleteGalleryAlbum(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteGalleryAlbum(req.user, id);
  }

  @Post("gallery/albums/:albumId/photos")
  @ApiOperation({ summary: "Ajouter une photo à un album officiel" })
  @ApiBody({ type: CreateGalleryPhotoDto })
  @ApiCreatedResponse({ description: "Photo ajoutée" })
  createGalleryPhoto(@Req() req: AuthedRequest, @Param("albumId") albumId: string, @Body() body: CreateGalleryPhotoDto) {
    return this.adminService.createGalleryPhoto(req.user, albumId, body);
  }

  @Patch("gallery/photos/:id")
  @ApiOperation({ summary: "Modifier une photo de galerie" })
  @ApiBody({ type: UpdateGalleryPhotoDto })
  @ApiOkResponse({ description: "Photo mise à jour" })
  updateGalleryPhoto(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateGalleryPhotoDto) {
    return this.adminService.updateGalleryPhoto(req.user, id, body);
  }

  @Delete("gallery/photos/:id")
  @ApiOperation({ summary: "Supprimer une photo de galerie" })
  @ApiOkResponse({ description: "Photo supprimée" })
  deleteGalleryPhoto(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteGalleryPhoto(req.user, id);
  }

  @Get("disciplines")
  @ApiOperation({ summary: "Lister toutes les disciplines du back-office" })
  @ApiOkResponse({ description: "Disciplines filtrées par recherche ou statut actif" })
  disciplines(@Req() req: AuthedRequest, @Query() query: ListAdminReferenceQueryDto) {
    return this.adminService.listDisciplines(req.user, query);
  }

  @Post("disciplines")
  @ApiOperation({ summary: "Ajouter une discipline" })
  @ApiBody({ type: CreateDisciplineDto })
  @ApiCreatedResponse({ description: "Discipline créée" })
  createDiscipline(@Req() req: AuthedRequest, @Body() body: CreateDisciplineDto) {
    return this.adminService.createDiscipline(req.user, body);
  }

  @Patch("disciplines/:id")
  @ApiOperation({ summary: "Modifier une discipline" })
  @ApiBody({ type: UpdateDisciplineDto })
  @ApiOkResponse({ description: "Discipline mise à jour" })
  updateDiscipline(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateDisciplineDto) {
    return this.adminService.updateDiscipline(req.user, id, body);
  }

  @Delete("disciplines/:id")
  @ApiOperation({ summary: "Supprimer une discipline" })
  @ApiOkResponse({ description: "Discipline supprimée" })
  deleteDiscipline(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deleteDiscipline(req.user, id);
  }

  @Get("partners")
  @ApiOperation({ summary: "Lister tous les partenaires du back-office" })
  @ApiOkResponse({ description: "Partenaires filtrés par recherche ou statut publié" })
  partners(@Req() req: AuthedRequest, @Query() query: ListAdminReferenceQueryDto) {
    return this.adminService.listPartners(req.user, query);
  }

  @Post("partners")
  @ApiOperation({ summary: "Ajouter un partenaire" })
  @ApiBody({ type: CreatePartnerDto })
  @ApiCreatedResponse({ description: "Partenaire créé" })
  createPartner(@Req() req: AuthedRequest, @Body() body: CreatePartnerDto) {
    return this.adminService.createPartner(req.user, body);
  }

  @Patch("partners/:id")
  @ApiOperation({ summary: "Modifier un partenaire" })
  @ApiBody({ type: UpdatePartnerDto })
  @ApiOkResponse({ description: "Partenaire mis à jour" })
  updatePartner(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdatePartnerDto) {
    return this.adminService.updatePartner(req.user, id, body);
  }

  @Delete("partners/:id")
  @ApiOperation({ summary: "Supprimer un partenaire" })
  @ApiOkResponse({ description: "Partenaire supprimé" })
  deletePartner(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.adminService.deletePartner(req.user, id);
  }
}
