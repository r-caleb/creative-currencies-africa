import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DirectMessageReportReason } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportGroupMessageDto {
  @ApiProperty({ enum: DirectMessageReportReason, example: DirectMessageReportReason.INAPPROPRIATE })
  @IsEnum(DirectMessageReportReason, { message: "Choisissez une raison de signalement valide." })
  reason!: DirectMessageReportReason;

  @ApiPropertyOptional({ example: "Ce message ne respecte pas l'esprit de la communauté." })
  @IsOptional()
  @IsString({ message: "Le détail du signalement est invalide." })
  @MaxLength(700, { message: "Le détail du signalement est trop long." })
  message?: string;
}
