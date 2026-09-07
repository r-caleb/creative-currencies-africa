import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApplyOpportunityDto } from "./dto/apply-opportunity.dto";
import { CreatePortfolioItemDto } from "./dto/create-portfolio-item.dto";
import { EnrollTrainingDto } from "./dto/enroll-training.dto";
import { MemberSearchQueryDto } from "./dto/member-search-query.dto";
import { RequestAccountEvolutionDto } from "./dto/request-account-evolution.dto";
import { UpdateMemberProfileDto } from "./dto/update-member-profile.dto";
import { UpdatePortfolioItemDto } from "./dto/update-portfolio-item.dto";
import { MemberService } from "./member.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Patch("profile")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Mettre à jour le profil du membre connecté" })
  @ApiBody({ type: UpdateMemberProfileDto })
  @ApiOkResponse({ description: "Profil membre mis à jour" })
  updateProfile(@Req() req: AuthedRequest, @Body() body: UpdateMemberProfileDto) {
    return this.memberService.updateProfile(req.user, body);
  }

  @Post("uploads")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 8 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Uploader une photo, un logo ou un CV PDF du membre connecté" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["AVATAR", "LOGO", "CV"] },
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOkResponse({ description: "Fichier uploadé et profil membre mis à jour" })
  uploadProfileAsset(@Req() req: AuthedRequest, @Body("kind") kind: string, @UploadedFile() file?: Express.Multer.File) {
    return this.memberService.uploadProfileAsset(req.user, kind, file);
  }

  @Get("search")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Rechercher globalement dans l'espace membre" })
  @ApiOkResponse({ description: "Résultats classés par créateurs, publications, formations, opportunités, ressources et partenaires" })
  search(@Req() req: AuthedRequest, @Query() query: MemberSearchQueryDto) {
    return this.memberService.search(req.user, query);
  }

  @Get("creative-id")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Consulter le Creative ID complet du membre connecté" })
  @ApiOkResponse({ description: "Profil, portfolio, historique officiel et badges du membre" })
  creativeId(@Req() req: AuthedRequest) {
    return this.memberService.getCreativeId(req.user);
  }

  @Post("creative-id/portfolio")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Ajouter une œuvre ou un projet au portfolio Creative ID" })
  @ApiBody({ type: CreatePortfolioItemDto })
  @ApiOkResponse({ description: "Élément portfolio ajouté" })
  createPortfolioItem(@Req() req: AuthedRequest, @Body() body: CreatePortfolioItemDto) {
    return this.memberService.createPortfolioItem(req.user, body);
  }

  @Patch("creative-id/portfolio/:id")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Modifier une œuvre ou un projet du portfolio Creative ID" })
  @ApiBody({ type: UpdatePortfolioItemDto })
  @ApiOkResponse({ description: "Élément portfolio mis à jour" })
  updatePortfolioItem(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdatePortfolioItemDto) {
    return this.memberService.updatePortfolioItem(req.user, id, body);
  }

  @Delete("creative-id/portfolio/:id")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Supprimer une œuvre ou un projet du portfolio Creative ID" })
  @ApiOkResponse({ description: "Élément portfolio supprimé" })
  deletePortfolioItem(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.memberService.deletePortfolioItem(req.user, id);
  }

  @Get("creative-id/:memberNumber")
  @ApiOperation({ summary: "Consulter un Creative ID public" })
  @ApiOkResponse({ description: "Creative ID public" })
  publicCreativeId(@Param("memberNumber") memberNumber: string) {
    return this.memberService.getPublicCreativeId(memberNumber);
  }

  @Get("network")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les membres visibles dans l'annuaire" })
  @ApiOkResponse({ description: "Annuaire des profils créatifs visibles aux membres" })
  network(@Req() req: AuthedRequest, @Query() query: Record<string, string | undefined>) {
    return this.memberService.getNetworkMembers(req.user, query);
  }

  @Get("network/profile/:memberNumber")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Consulter le profil complet d'un membre visible dans le réseau" })
  @ApiOkResponse({ description: "Profil réseau, Creative ID et publications visibles" })
  networkProfile(@Req() req: AuthedRequest, @Param("memberNumber") memberNumber: string) {
    return this.memberService.getNetworkMemberProfile(req.user, memberNumber);
  }

  @Post("network/:userId/save")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Ajouter un membre visible à son réseau" })
  @ApiOkResponse({ description: "Membre ajouté au réseau personnel" })
  saveNetworkMember(@Req() req: AuthedRequest, @Param("userId") userId: string) {
    return this.memberService.saveNetworkMember(req.user, userId);
  }

  @Delete("network/:userId/save")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Retirer un membre de son réseau" })
  @ApiOkResponse({ description: "Membre retiré du réseau personnel" })
  removeNetworkMember(@Req() req: AuthedRequest, @Param("userId") userId: string) {
    return this.memberService.removeNetworkMember(req.user, userId);
  }

  @Get("account-evolution")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Consulter les possibilités d'évolution du parcours membre" })
  @ApiOkResponse({ description: "Type de compte actuel, actions disponibles et demandes existantes" })
  accountEvolution(@Req() req: AuthedRequest) {
    return this.memberService.getAccountEvolution(req.user);
  }

  @Post("account-evolution")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Demander une évolution de parcours, par exemple apprenant vers créateur" })
  @ApiBody({ type: RequestAccountEvolutionDto })
  @ApiOkResponse({ description: "Demande envoyée à l'équipe CCA" })
  requestAccountEvolution(@Req() req: AuthedRequest, @Body() body: RequestAccountEvolutionDto) {
    return this.memberService.requestAccountEvolution(req.user, body);
  }

  @Get("trainings")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les formations accessibles au membre connecté" })
  @ApiOkResponse({ description: "Catalogue formations, inscriptions et publications de formation" })
  trainings(@Req() req: AuthedRequest) {
    return this.memberService.getTrainings(req.user);
  }

  @Post("trainings/:id/enroll")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "S'inscrire à une formation publiée" })
  @ApiBody({ type: EnrollTrainingDto })
  @ApiOkResponse({ description: "Inscription formation confirmée" })
  enrollTraining(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: EnrollTrainingDto) {
    return this.memberService.enrollTraining(req.user, id, body);
  }

  @Get("opportunities")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les opportunités accessibles au membre connecté" })
  @ApiOkResponse({ description: "Catalogue opportunités, candidatures et publications d'opportunités" })
  opportunities(@Req() req: AuthedRequest) {
    return this.memberService.getOpportunities(req.user);
  }

  @Post("opportunities/:id/apply")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Préparer ou soumettre une candidature à une opportunité" })
  @ApiBody({ type: ApplyOpportunityDto })
  @ApiOkResponse({ description: "Candidature opportunité enregistrée" })
  applyOpportunity(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: ApplyOpportunityDto) {
    return this.memberService.applyOpportunity(req.user, id, body);
  }

  @Get("resources")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les ressources accessibles au membre connecté" })
  @ApiOkResponse({ description: "Bibliothèque, ressources de formations et ressources publiées" })
  resources(@Req() req: AuthedRequest) {
    return this.memberService.getResources(req.user);
  }

  @Post("resources/:id/view")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Enregistrer une consultation de ressource accessible" })
  @ApiOkResponse({ description: "Consultation enregistrée après vérification des droits" })
  viewResource(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.memberService.viewResource(req.user, id);
  }

  @Get("resources/:id/download")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtenir le lien de téléchargement sécurisé d'une ressource" })
  @ApiOkResponse({ description: "Lien autorisé et téléchargement journalisé" })
  downloadResource(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.memberService.downloadResource(req.user, id);
  }

  @Post("resources/:id/useful")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Marquer ou retirer une ressource comme utile" })
  @ApiOkResponse({ description: "Préférence utile mise à jour" })
  toggleUsefulResource(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.memberService.toggleUsefulResource(req.user, id);
  }

  @Get("agenda")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les dates importantes accessibles au membre connecté" })
  @ApiOkResponse({ description: "Agenda membre alimenté par événements, formations, opportunités et publications datées" })
  agenda(@Req() req: AuthedRequest) {
    return this.memberService.getAgenda(req.user);
  }

  @Post("agenda/events/:id/register")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "S'inscrire à un événement de l'agenda" })
  @ApiOkResponse({ description: "Inscription événement enregistrée" })
  registerAgendaEvent(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.memberService.registerAgendaEvent(req.user, id);
  }

  @Get("certificates")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Lister les certificats CCA du membre connecté" })
  @ApiOkResponse({ description: "Certificats personnels, badges visibles et statistiques" })
  certificates(@Req() req: AuthedRequest) {
    return this.memberService.getCertificates(req.user);
  }

  @Get("certificates/verify/:number")
  @ApiOperation({ summary: "Vérifier publiquement un certificat CCA" })
  @ApiOkResponse({ description: "Statut public de vérification du certificat" })
  verifyCertificate(@Param("number") number: string) {
    return this.memberService.verifyCertificate(number);
  }

  @Post("certificates/issue")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Délivrer un certificat CCA à un apprenant ou créateur" })
  @ApiOkResponse({ description: "Certificat CCA créé" })
  issueCertificate(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.memberService.issueCertificate(req.user, body);
  }
}
