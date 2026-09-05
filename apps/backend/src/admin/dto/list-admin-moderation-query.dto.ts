import { ApiPropertyOptional } from "@nestjs/swagger";
import { DirectMessageReportReason, DirectMessageReportStatus, PublicationReportReason, PublicationReportStatus } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListAdminModerationQueryDto {
  @ApiPropertyOptional({ enum: PublicationReportStatus, example: PublicationReportStatus.PENDING })
  @IsOptional()
  @IsEnum(PublicationReportStatus, { message: "Le statut de signalement est invalide." })
  status?: PublicationReportStatus;

  @ApiPropertyOptional({ enum: PublicationReportReason, example: PublicationReportReason.INAPPROPRIATE })
  @IsOptional()
  @IsEnum(PublicationReportReason, { message: "La raison de signalement est invalide." })
  reason?: PublicationReportReason;

  @ApiPropertyOptional({ example: "nom, e-mail, titre ou contenu" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  q?: string;

  @ApiPropertyOptional({ example: "2026-09-01" })
  @IsOptional()
  @IsDateString({}, { message: "La date de début est invalide." })
  from?: string;

  @ApiPropertyOptional({ example: "2026-09-30" })
  @IsOptional()
  @IsDateString({}, { message: "La date de fin est invalide." })
  to?: string;

  @ApiPropertyOptional({ example: "50" })
  @IsOptional()
  @IsString({ message: "La limite doit être transmise sous forme de texte." })
  limit?: string;
}

export class ListAdminMessageReportsQueryDto {
  @ApiPropertyOptional({ enum: DirectMessageReportStatus, example: DirectMessageReportStatus.PENDING })
  @IsOptional()
  @IsEnum(DirectMessageReportStatus, { message: "Le statut de signalement est invalide." })
  status?: DirectMessageReportStatus;

  @ApiPropertyOptional({ enum: DirectMessageReportReason, example: DirectMessageReportReason.HARASSMENT })
  @IsOptional()
  @IsEnum(DirectMessageReportReason, { message: "La raison de signalement est invalide." })
  reason?: DirectMessageReportReason;

  @ApiPropertyOptional({ example: "nom, e-mail ou contenu du message" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  q?: string;

  @ApiPropertyOptional({ example: "2026-09-01" })
  @IsOptional()
  @IsDateString({}, { message: "La date de début est invalide." })
  from?: string;

  @ApiPropertyOptional({ example: "2026-09-30" })
  @IsOptional()
  @IsDateString({}, { message: "La date de fin est invalide." })
  to?: string;

  @ApiPropertyOptional({ example: "50" })
  @IsOptional()
  @IsString({ message: "La limite doit être transmise sous forme de texte." })
  limit?: string;
}
