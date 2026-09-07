import { ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateOpportunityApplicationDto {
  @ApiPropertyOptional({ enum: ApplicationStatus, example: ApplicationStatus.UNDER_REVIEW })
  @IsOptional()
  @IsEnum(ApplicationStatus, { message: "Le statut de candidature est invalide." })
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: "Profil intéressant pour le jury design. Demander une pièce complémentaire si nécessaire." })
  @IsOptional()
  @IsString({ message: "La note interne doit être un texte." })
  adminNote?: string;
}
