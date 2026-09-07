import { ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationReportStatus, PublicationStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ModeratePublicationReportDto {
  @ApiPropertyOptional({ enum: PublicationReportStatus, example: PublicationReportStatus.REVIEWED })
  @IsOptional()
  @IsEnum(PublicationReportStatus, { message: "Choisissez un statut de signalement valide." })
  status?: PublicationReportStatus;

  @ApiPropertyOptional({ enum: PublicationStatus, example: PublicationStatus.ARCHIVED })
  @IsOptional()
  @IsEnum(PublicationStatus, { message: "Choisissez un statut de publication valide." })
  publicationStatus?: PublicationStatus;
}
