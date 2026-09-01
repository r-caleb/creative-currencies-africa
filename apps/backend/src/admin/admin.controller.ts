import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminService } from "./admin.service";

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
  reports(@Req() req: AuthedRequest, @Query() query: Record<string, string | undefined>) {
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
}
