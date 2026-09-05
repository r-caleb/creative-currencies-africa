import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DirectMessageReportStatus } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ModerateDirectMessageReportDto {
  @ApiProperty({ enum: DirectMessageReportStatus, example: DirectMessageReportStatus.REVIEWED })
  @IsEnum(DirectMessageReportStatus, { message: "Choisissez un statut de signalement valide." })
  status!: DirectMessageReportStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "L'action de suppression du message doit être valide." })
  deleteMessage?: boolean;

  @ApiPropertyOptional({ example: "Message masqué après revue de l'équipe CCA." })
  @IsOptional()
  @IsString({ message: "La note de modération est invalide." })
  @MaxLength(700, { message: "La note de modération est trop longue." })
  note?: string;
}
