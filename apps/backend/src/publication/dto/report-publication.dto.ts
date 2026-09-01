import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationReportReason } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportPublicationDto {
  @ApiProperty({ enum: PublicationReportReason, example: PublicationReportReason.MISLEADING })
  @IsEnum(PublicationReportReason, { message: "Choisissez une raison de signalement valide." })
  reason!: PublicationReportReason;

  @ApiPropertyOptional({ example: "Le lien indiqué ne correspond pas à l'opportunité présentée." })
  @IsOptional()
  @IsString({ message: "Le détail du signalement est invalide." })
  @MaxLength(700, { message: "Le détail du signalement est trop long." })
  message?: string;
}
