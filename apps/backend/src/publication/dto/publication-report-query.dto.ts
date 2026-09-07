import { ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationReportReason, PublicationReportStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min, Max } from "class-validator";

export class PublicationReportQueryDto {
  @ApiPropertyOptional({ enum: PublicationReportStatus, example: PublicationReportStatus.PENDING })
  @IsOptional()
  @IsEnum(PublicationReportStatus, { message: "Choisissez un statut de signalement valide." })
  status?: PublicationReportStatus;

  @ApiPropertyOptional({ enum: PublicationReportReason, example: PublicationReportReason.INAPPROPRIATE })
  @IsOptional()
  @IsEnum(PublicationReportReason, { message: "Choisissez une raison de signalement valide." })
  reason?: PublicationReportReason;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être positive." })
  @Max(100, { message: "La limite maximale est 100." })
  limit?: number;
}
