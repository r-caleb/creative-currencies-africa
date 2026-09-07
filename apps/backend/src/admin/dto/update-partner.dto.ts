import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class UpdatePartnerDto {
  @ApiPropertyOptional({ example: "Congo Résilience" })
  @IsOptional()
  @IsString({ message: "Le nom du partenaire doit être un texte." })
  name?: string;

  @ApiPropertyOptional({ example: "Institution" })
  @IsOptional()
  @IsString({ message: "Le type du partenaire doit être un texte." })
  type?: string;

  @ApiPropertyOptional({ example: "Partenaire institutionnel du programme Creative Currencies Africa." })
  @IsOptional()
  @IsString({ message: "La description doit être un texte." })
  description?: string;

  @ApiPropertyOptional({ example: "https://cdn.creativecurrencies.africa/partners/congo-resilience.png" })
  @IsOptional()
  @IsString({ message: "Le logo doit être un chemin ou une URL valide." })
  logoUrl?: string;

  @ApiPropertyOptional({ example: "https://example.com" })
  @IsOptional()
  @IsUrl({}, { message: "Le site web doit être une URL valide." })
  website?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "Le numéro d'affichage doit être un nombre entier." })
  @Min(1, { message: "Le numéro d'affichage doit être supérieur ou égal à 1." })
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;
}
