import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateDisciplineDto } from "./dto/create-discipline.dto";
import { UpdateDisciplineDto } from "./dto/update-discipline.dto";
import { ReferenceService } from "./reference.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("reference")
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get("account-types")
  accountTypes() {
    return this.referenceService.getAccountTypes();
  }

  @Get("disciplines")
  @ApiOperation({ summary: "Lister les disciplines actives" })
  @ApiOkResponse({ description: "Liste des disciplines disponibles" })
  disciplines() {
    return this.referenceService.getDisciplines();
  }

  @Get("partners")
  @ApiOperation({ summary: "Lister les partenaires publiés pour le site public" })
  @ApiOkResponse({ description: "Partenaires actifs affichables sur la landing page" })
  partners() {
    return this.referenceService.getPartners();
  }

  @Get("landing-event")
  @ApiOperation({ summary: "Afficher l'événement officiel de la landing page" })
  @ApiOkResponse({ description: "Dernier événement publié, prioritairement mis en avant sur l'accueil" })
  landingEvent() {
    return this.referenceService.getLandingEvent();
  }

  @Post("disciplines")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Créer une discipline" })
  @ApiBody({ type: CreateDisciplineDto })
  @ApiCreatedResponse({ description: "Discipline créée" })
  createDiscipline(@Req() req: AuthedRequest, @Body() body: CreateDisciplineDto) {
    return this.referenceService.createDiscipline(req.user, body);
  }

  @Patch("disciplines/:id")
  @ApiBearerAuth("access-token")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Modifier ou désactiver une discipline" })
  @ApiBody({ type: UpdateDisciplineDto })
  @ApiOkResponse({ description: "Discipline mise à jour" })
  updateDiscipline(@Req() req: AuthedRequest, @Param("id") id: string, @Body() body: UpdateDisciplineDto) {
    return this.referenceService.updateDiscipline(req.user, id, body);
  }

  @Get("onboarding-fields")
  onboardingFields() {
    return this.referenceService.getOnboardingFields();
  }
}
