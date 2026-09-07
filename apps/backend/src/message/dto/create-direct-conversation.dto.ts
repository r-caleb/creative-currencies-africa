import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class CreateDirectConversationDto {
  @ApiPropertyOptional({ example: "clxmember123" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le membre est requis." })
  @MaxLength(80, { message: "L'identifiant du membre est trop long." })
  memberId?: string;

  @ApiPropertyOptional({ example: "CCA-2026-9198" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le numéro membre est invalide." })
  @MaxLength(40, { message: "Le numéro membre est trop long." })
  memberNumber?: string;

  @ApiPropertyOptional({ example: "Bonjour, je souhaite échanger sur votre projet." })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le message doit être un texte." })
  @MaxLength(4000, { message: "Le message est trop long." })
  initialMessage?: string;
}
