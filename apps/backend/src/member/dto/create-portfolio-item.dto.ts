import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Max, Min, ValidateIf } from "class-validator";

export class CreatePortfolioItemDto {
  @ApiPropertyOptional({ example: "Série photo backstage CCA" })
  @IsString({ message: "Le titre du projet doit être un texte." })
  title!: string;

  @ApiPropertyOptional({ example: "Photographie" })
  @IsString({ message: "La discipline du projet doit être un texte." })
  category!: string;

  @ApiPropertyOptional({ example: "Une sélection d'images réalisées pendant les ateliers créatifs." })
  @IsOptional()
  @IsString({ message: "La description doit être un texte." })
  description?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/portfolio/backstage.jpg" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien du média doit être une URL valide." })
  mediaUrl?: string;

  @ApiPropertyOptional({ example: "https://behance.net/projet" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien externe doit être une URL valide." })
  externalUrl?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'année doit être un nombre entier." })
  @Min(1990, { message: "L'année semble trop ancienne." })
  @Max(2100, { message: "L'année semble trop éloignée." })
  year?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "La mise en avant doit être vraie ou fausse." })
  featured?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le numéro d'affichage doit être un nombre entier." })
  @Min(0, { message: "Le numéro d'affichage doit être positif." })
  order?: number;
}
