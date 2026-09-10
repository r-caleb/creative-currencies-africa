import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdatePlatformProfileDto {
  @ApiPropertyOptional({ example: "Creative Currencies Africa" })
  @IsOptional()
  @IsString({ message: "Le nom officiel doit être un texte." })
  displayName?: string;

  @ApiPropertyOptional({ example: "/assets/cca-mask-gold-transparent.png" })
  @IsOptional()
  @IsString({ message: "Le logo officiel doit être un chemin ou une URL." })
  logoUrl?: string;

  @ApiPropertyOptional({ example: "contact@creativecurrencies.africa" })
  @IsOptional()
  @IsString({ message: "L'e-mail public doit être un texte." })
  publicEmail?: string;

  @ApiPropertyOptional({ example: "+243 000 000 000" })
  @IsOptional()
  @IsString({ message: "Le téléphone doit être un texte." })
  phone?: string;

  @ApiPropertyOptional({ example: "https://wa.me/243000000000" })
  @IsOptional()
  @IsString({ message: "Le lien WhatsApp doit être un texte." })
  whatsappUrl?: string;

  @ApiPropertyOptional({ example: "https://creativecurrencies.africa" })
  @IsOptional()
  @IsString({ message: "Le site web doit être un texte." })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: "https://facebook.com/creativecurrenciesafrica" })
  @IsOptional()
  @IsString({ message: "Le lien Facebook doit être un texte." })
  facebookUrl?: string;

  @ApiPropertyOptional({ example: "https://instagram.com/creativecurrenciesafrica" })
  @IsOptional()
  @IsString({ message: "Le lien Instagram doit être un texte." })
  instagramUrl?: string;

  @ApiPropertyOptional({ example: "https://linkedin.com/company/creative-currencies-africa" })
  @IsOptional()
  @IsString({ message: "Le lien LinkedIn doit être un texte." })
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: "https://youtube.com/@creativecurrenciesafrica" })
  @IsOptional()
  @IsString({ message: "Le lien YouTube doit être un texte." })
  youtubeUrl?: string;

  @ApiPropertyOptional({ example: "Plateforme communautaire dédiée aux industries culturelles et créatives africaines." })
  @IsOptional()
  @IsString({ message: "Le texte institutionnel doit être un texte." })
  shortBio?: string;
}
