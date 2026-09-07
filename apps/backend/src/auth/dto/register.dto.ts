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
  MaxLength,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  @MaxLength(254, { message: "L'adresse e-mail est trop longue." })
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le mot de passe est requis" })
  @MaxLength(128, { message: "Le mot de passe est trop long." })
  password!: string;

  @ApiProperty({ example: "Aïcha" })
  @IsString({ message: "Le prénom est requis" })
  @MaxLength(80, { message: "Le prénom est trop long." })
  firstName!: string;

  @ApiProperty({ example: "Kabulo" })
  @IsString({ message: "Le nom est requis" })
  @MaxLength(80, { message: "Le nom est trop long." })
  lastName!: string;

  @ApiPropertyOptional({ example: "+243 898 192 765" })
  @IsOptional()
  @IsString({ message: "Le numéro de téléphone doit être un texte" })
  @MaxLength(40, { message: "Le numéro de téléphone est trop long." })
  phone?: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CREATOR })
  @IsEnum(AccountType, { message: "Choisissez un type de compte valide." })
  type!: AccountType;

  @ApiProperty({ example: "République démocratique du Congo" })
  @IsString({ message: "Le pays est requis" })
  @MaxLength(100, { message: "Le pays est trop long." })
  country!: string;

  @ApiProperty({ example: "Kinshasa" })
  @IsString({ message: "La ville est requise" })
  @MaxLength(100, { message: "La ville est trop longue." })
  city!: string;

  @ApiPropertyOptional({ example: "Photographe" })
  @IsOptional()
  @IsString({ message: "La profession doit être un texte" })
  @MaxLength(120, { message: "La profession est trop longue." })
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
  @MaxLength(120, { message: "La discipline principale est trop longue." })
  discipline?: string;

  @ApiPropertyOptional({ example: "Art numérique" })
  @IsOptional()
  @IsString({ message: "La discipline personnalisée doit être un texte" })
  @MaxLength(120, { message: "La discipline personnalisée est trop longue." })
  otherDiscipline?: string;

  @ApiPropertyOptional({
    example: "Je développe une pratique photographique autour de la mode, de la mémoire et des scènes urbaines.",
  })
  @IsOptional()
  @IsString({ message: "La bio doit être un texte" })
  @MaxLength(900, { message: "La bio est trop longue." })
  bio?: string;

  @ApiPropertyOptional({ example: "https://portfolio.example.com/aicha" })
  @IsOptional()
  @IsUrl({}, { message: "Entrez un lien de portfolio valide, par exemple https://monsite.com." })
  @MaxLength(500, { message: "Le lien de portfolio est trop long." })
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "https://aicha.example.com" })
  @IsOptional()
  @IsUrl({}, { message: "Entrez un site web valide, par exemple https://monsite.com." })
  @MaxLength(500, { message: "Le lien du site web est trop long." })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/aicha.jpg" })
  @IsOptional()
  @IsUrl({}, { message: "Le lien de la photo n'est pas valide." })
  @MaxLength(500, { message: "Le lien de la photo est trop long." })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/cv/aicha.pdf" })
  @IsOptional()
  @IsUrl({}, { message: "Le lien du CV n'est pas valide." })
  @MaxLength(500, { message: "Le lien du CV est trop long." })
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
  @MaxLength(500, { message: "La disponibilité est trop longue." })
  availability?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.ORGANIZATION)
  @ApiPropertyOptional({ example: "Studio Photo Kin" })
  @IsString({ message: "Le nom de l'organisation est requis" })
  @MaxLength(160, { message: "Le nom de l'organisation est trop long." })
  organizationName?: string;

  @ApiPropertyOptional({ example: "Studio Photo Kin SARL" })
  @IsOptional()
  @IsString({ message: "Le nom légal de l'organisation doit être un texte" })
  @MaxLength(180, { message: "Le nom légal de l'organisation est trop long." })
  organizationLegalName?: string;

  @ApiPropertyOptional({ example: "Formation et production audiovisuelle" })
  @IsOptional()
  @IsString({ message: "Le secteur de l'organisation doit être un texte" })
  @MaxLength(140, { message: "Le secteur de l'organisation est trop long." })
  organizationSector?: string;

  @ApiPropertyOptional({ example: "Structure culturelle active dans la formation et la production photo." })
  @IsOptional()
  @IsString({ message: "La description de l'organisation doit être un texte" })
  @MaxLength(900, { message: "La description de l'organisation est trop longue." })
  organizationDescription?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Fondation Culture & Impact" })
  @IsString({ message: "Le nom du partenaire est requis" })
  @MaxLength(160, { message: "Le nom du partenaire est trop long." })
  partnerName?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Sponsor" })
  @IsString({ message: "Le type de partenaire est requis" })
  @MaxLength(120, { message: "Le type de partenaire est trop long." })
  partnerType?: string;

  @ApiPropertyOptional({ example: "Partenaire engagé dans le financement de programmes créatifs." })
  @IsOptional()
  @IsString({ message: "La description du partenaire doit être un texte" })
  @MaxLength(900, { message: "La description du partenaire est trop longue." })
  partnerDescription?: string;
}
