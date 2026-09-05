import { ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ApplyOpportunityDto {
  @ApiPropertyOptional({ enum: [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED], example: ApplicationStatus.SUBMITTED })
  @IsOptional()
  @IsIn([ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED], { message: "Vous pouvez seulement préparer ou soumettre votre candidature." })
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: "Je souhaite participer pour développer mon projet et présenter une démarche professionnelle." })
  @IsOptional()
  @IsString({ message: "La motivation doit être un texte." })
  motivation?: string;

  @ApiPropertyOptional({ example: "Design graphique" })
  @IsOptional()
  @IsString({ message: "La discipline doit être un texte." })
  @MaxLength(120, { message: "La discipline est trop longue." })
  discipline?: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @IsString({ message: "La ville doit être un texte." })
  @MaxLength(120, { message: "La ville est trop longue." })
  city?: string;

  @ApiPropertyOptional({ example: "+243 000 000 000" })
  @IsOptional()
  @IsString({ message: "Le téléphone doit être un texte." })
  @MaxLength(40, { message: "Le téléphone est trop long." })
  phone?: string;

  @ApiPropertyOptional({ example: "https://portfolio.example.com" })
  @IsOptional()
  @IsString({ message: "Le portfolio doit être un lien ou un chemin." })
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "/uploads/cv.pdf" })
  @IsOptional()
  @IsString({ message: "Le CV doit être un lien ou un chemin." })
  cvUrl?: string;

  @ApiPropertyOptional({ example: "/uploads/dossier.pdf" })
  @IsOptional()
  @IsString({ message: "Le fichier joint doit être un lien ou un chemin." })
  fileUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ["https://behance.net/cca", "https://instagram.com/cca"] })
  @IsOptional()
  @IsArray({ message: "Les liens doivent être une liste." })
  @IsString({ each: true, message: "Chaque lien doit être un texte." })
  links?: string[];

  @ApiPropertyOptional({ type: [String], example: ["Instagram: https://instagram.com/cca"] })
  @IsOptional()
  @IsArray({ message: "Les réseaux sociaux doivent être une liste." })
  @IsString({ each: true, message: "Chaque réseau social doit être un texte." })
  socialLinks?: string[];
}
