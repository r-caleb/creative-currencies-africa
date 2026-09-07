import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class CreateDirectMessageDto {
  @ApiProperty({ example: "Bonjour, votre profil m'intéresse pour une collaboration." })
  @IsString({ message: "Le message est requis." })
  @MaxLength(4000, { message: "Le message est trop long." })
  content!: string;

  @ApiPropertyOptional({ example: "/uploads/publications/brief.pdf" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le lien du fichier doit être un texte." })
  @MaxLength(500, { message: "Le lien du fichier est trop long." })
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: "brief.pdf" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le nom du fichier doit être un texte." })
  @MaxLength(160, { message: "Le nom du fichier est trop long." })
  attachmentName?: string;

  @ApiPropertyOptional({ example: "application/pdf" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le type du fichier doit être un texte." })
  @MaxLength(120, { message: "Le type du fichier est trop long." })
  attachmentMimeType?: string;
}
