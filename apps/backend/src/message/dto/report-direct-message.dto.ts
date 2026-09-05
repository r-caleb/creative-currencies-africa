import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DirectMessageReportReason } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportDirectMessageDto {
  @ApiProperty({ enum: DirectMessageReportReason, example: DirectMessageReportReason.INAPPROPRIATE })
  @IsEnum(DirectMessageReportReason, { message: "Choisissez une raison de signalement valide." })
  reason!: DirectMessageReportReason;

  @ApiPropertyOptional({ example: "Ce message contient un propos déplacé." })
  @IsOptional()
  @IsString({ message: "Le détail du signalement est invalide." })
  @MaxLength(700, { message: "Le détail du signalement est trop long." })
  message?: string;
}
