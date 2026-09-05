import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DirectMessageReportStatus } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAdminMessageReportDto {
  @ApiProperty({ enum: DirectMessageReportStatus, example: DirectMessageReportStatus.REVIEWED })
  @IsEnum(DirectMessageReportStatus, { message: "Le statut de signalement est invalide." })
  status!: DirectMessageReportStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "L'action de suppression du message est invalide." })
  deleteMessage?: boolean;

  @ApiPropertyOptional({ example: "Message supprimé après revue de l'équipe CCA." })
  @IsOptional()
  @IsString({ message: "La note de modération doit être un texte." })
  @MaxLength(700, { message: "La note de modération est trop longue." })
  note?: string;
}
