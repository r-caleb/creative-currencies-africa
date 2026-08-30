import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountType, Gender } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le mot de passe est requis" })
  password!: string;

  @ApiProperty({ example: "Aïcha" })
  @IsString({ message: "Le prénom est requis" })
  firstName!: string;

  @ApiProperty({ example: "Kabulo" })
  @IsString({ message: "Le nom est requis" })
  lastName!: string;

  @ApiPropertyOptional({ example: "+243 898 192 765" })
  @IsOptional()
  @IsString({ message: "Le numéro de téléphone doit être un texte" })
  phone?: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CREATOR })
  @IsEnum(AccountType, { message: "Choisissez un type de compte valide." })
  type!: AccountType;

  @ApiProperty({ example: "République démocratique du Congo" })
  @IsString({ message: "Le pays est requis" })
  country!: string;

  @ApiProperty({ example: "Kinshasa" })
  @IsString({ message: "La ville est requise" })
  city!: string;

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

  @ValidateIf((body: RegisterDto) => body.type === AccountType.CREATOR || body.type === AccountType.LEARNER)
  @ApiPropertyOptional({ example: "Photographie" })
  @IsString({ message: "La discipline principale est requise" })
  discipline?: string;

  @ApiPropertyOptional({ example: "Art numérique" })
  @IsOptional()
  @IsString({ message: "La discipline personnalisée doit être un texte" })
  otherDiscipline?: string;

  @ApiPropertyOptional({
    example: "Je développe une pratique photographique autour de la mode, de la mémoire et des scènes urbaines.",
  })
  @IsOptional()
  @IsString({ message: "La bio doit être un texte" })
  bio?: string;

  @ApiPropertyOptional({ example: "https://portfolio.example.com/aicha" })
  @IsOptional()
  @IsUrl({}, { message: "Entrez un lien de portfolio valide, par exemple https://monsite.com." })
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "https://aicha.example.com" })
  @IsOptional()
  @IsUrl({}, { message: "Entrez un site web valide, par exemple https://monsite.com." })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/aicha.jpg" })
  @IsOptional()
  @IsUrl({}, { message: "Le lien de la photo n'est pas valide." })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/cv/aicha.pdf" })
  @IsOptional()
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

  @ValidateIf((body: RegisterDto) => body.type === AccountType.ORGANIZATION)
  @ApiPropertyOptional({ example: "Studio Photo Kin" })
  @IsString({ message: "Le nom de l'organisation est requis" })
  organizationName?: string;

  @ApiPropertyOptional({ example: "Studio Photo Kin SARL" })
  @IsOptional()
  @IsString({ message: "Le nom légal de l'organisation doit être un texte" })
  organizationLegalName?: string;

  @ApiPropertyOptional({ example: "Formation et production audiovisuelle" })
  @IsOptional()
  @IsString({ message: "Le secteur de l'organisation doit être un texte" })
  organizationSector?: string;

  @ApiPropertyOptional({ example: "Structure culturelle active dans la formation et la production photo." })
  @IsOptional()
  @IsString({ message: "La description de l'organisation doit être un texte" })
  organizationDescription?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Fondation Culture & Impact" })
  @IsString({ message: "Le nom du partenaire est requis" })
  partnerName?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Sponsor" })
  @IsString({ message: "Le type de partenaire est requis" })
  partnerType?: string;

  @ApiPropertyOptional({ example: "Partenaire engagé dans le financement de programmes créatifs." })
  @IsOptional()
  @IsString({ message: "La description du partenaire doit être un texte" })
  partnerDescription?: string;
}
