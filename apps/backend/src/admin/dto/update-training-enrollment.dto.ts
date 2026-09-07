import { ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateTrainingEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus, example: EnrollmentStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: "Le statut d'inscription est invalide." })
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt({ message: "La progression doit être un nombre entier." })
  @Min(0, { message: "La progression ne peut pas être négative." })
  @Max(100, { message: "La progression ne peut pas dépasser 100%." })
  progress?: number;

  @ApiPropertyOptional({ example: "Participant confirmé par l'équipe CCA." })
  @IsOptional()
  @IsString({ message: "La note interne doit être un texte." })
  adminNote?: string;
}
