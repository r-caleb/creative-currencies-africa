import { ApiPropertyOptional } from "@nestjs/swagger";
import { Gender, ProfileVisibility } from "@prisma/client";
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUrl, ValidateIf } from "class-validator";

export class UpdateMemberProfileDto {
  @ApiPropertyOptional({ example: "Aïcha" })
  @IsOptional()
  @IsString({ message: "Le prénom doit être un texte" })
  firstName?: string;

  @ApiPropertyOptional({ example: "Kabulo" })
  @IsOptional()
  @IsString({ message: "Le nom doit être un texte" })
  lastName?: string;

  @ApiPropertyOptional({ example: "+243 898 192 765" })
  @IsOptional()
  @IsString({ message: "Le numéro de téléphone doit être un texte" })
  phone?: string;

  @ApiPropertyOptional({ example: "Aïcha Kabulo" })
  @IsOptional()
  @IsString({ message: "Le nom public doit être un texte" })
  publicName?: string;

  @ApiPropertyOptional({ example: "Congo RDC" })
  @IsOptional()
  @IsString({ message: "Le pays doit être un texte" })
  country?: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @IsString({ message: "La ville doit être un texte" })
  city?: string;

  @ApiPropertyOptional({ example: "Photographe" })
  @IsOptional()
  @IsString({ message: "La profession doit être un texte" })
  profession?: string;

  @ApiPropertyOptional({ example: "2001-08-20" })
  @IsOptional()
  @IsDateString({}, { message: "Entrez une date de naissance valide." })
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender, { message: "Choisissez une option de genre valide." })
  gender?: Gender;

  @ApiPropertyOptional({ example: "Photographie" })
  @IsOptional()
  @IsString({ message: "La discipline doit être un texte" })
  discipline?: string;

  @ApiPropertyOptional({ example: "Scénographie" })
  @IsOptional()
  @IsString({ message: "La discipline personnalisée doit être un texte" })
  otherDiscipline?: string;

  @ApiPropertyOptional({ example: "Créative basée à Kinshasa, spécialisée dans l'image et la mode." })
  @IsOptional()
  @IsString({ message: "La bio doit être un texte" })
  bio?: string;

  @ApiPropertyOptional({ example: "https://portfolio.example.com/aicha" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Entrez un lien de portfolio valide, par exemple https://monsite.com." })
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "https://aicha.example.com" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Entrez un site web valide, par exemple https://monsite.com." })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/aicha.jpg" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien de la photo n'est pas valide." })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/cv/aicha.pdf" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien du CV n'est pas valide." })
  cvUrl?: string;

  @ApiPropertyOptional({ example: ["Portrait", "Retouche", "Storytelling visuel"] })
  @IsOptional()
  @IsArray({ message: "Les compétences doivent être une liste" })
  @IsString({ each: true, message: "Chaque compétence doit être un texte" })
  skills?: string[];

  @ApiPropertyOptional({ example: ["Français", "Lingala"] })
  @IsOptional()
  @IsArray({ message: "Les langues doivent être une liste" })
  @IsString({ each: true, message: "Chaque langue doit être un texte" })
  languages?: string[];

  @ApiPropertyOptional({ example: "Disponible pour workshops, commandes photo et collaborations culturelles." })
  @IsOptional()
  @IsString({ message: "La disponibilité doit être un texte" })
  availability?: string;

  @ApiPropertyOptional({ enum: ProfileVisibility, example: ProfileVisibility.MEMBERS })
  @IsOptional()
  @IsEnum(ProfileVisibility, { message: "Choisissez une visibilité de profil valide." })
  visibility?: ProfileVisibility;

  @ApiPropertyOptional({ example: "Studio Photo Kin" })
  @IsOptional()
  @IsString({ message: "Le nom de l'organisation doit être un texte" })
  organizationName?: string;

  @ApiPropertyOptional({ example: "Studio Photo Kin SARL" })
  @IsOptional()
  @IsString({ message: "Le nom légal de l'organisation doit être un texte" })
  organizationLegalName?: string;

  @ApiPropertyOptional({ example: "Formation et production audiovisuelle" })
  @IsOptional()
  @IsString({ message: "Le secteur de l'organisation doit être un texte" })
  organizationSector?: string;

  @ApiPropertyOptional({ example: "Structure culturelle active dans la formation et la production." })
  @IsOptional()
  @IsString({ message: "La description de l'organisation doit être un texte" })
  organizationDescription?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/logos/studio-photo-kin.png" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien du logo n'est pas valide." })
  organizationLogoUrl?: string;

  @ApiPropertyOptional({ example: "Fondation Culture & Impact" })
  @IsOptional()
  @IsString({ message: "Le nom du partenaire doit être un texte" })
  partnerName?: string;

  @ApiPropertyOptional({ example: "Sponsor" })
  @IsOptional()
  @IsString({ message: "Le type de partenaire doit être un texte" })
  partnerType?: string;

  @ApiPropertyOptional({ example: "Partenaire engagé dans le financement des projets créatifs." })
  @IsOptional()
  @IsString({ message: "La description du partenaire doit être un texte" })
  partnerDescription?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/logos/fondation-culture.png" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien du logo n'est pas valide." })
  partnerLogoUrl?: string;
}
