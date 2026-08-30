import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationAttachmentType, PublicationAudience, PublicationType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class PublicationAttachmentDto {
  @ApiProperty({ enum: PublicationAttachmentType, example: PublicationAttachmentType.IMAGE })
  @IsEnum(PublicationAttachmentType, { message: "Choisissez un type de fichier valide." })
  type!: PublicationAttachmentType;

  @ApiProperty({ example: "/uploads/publications/image.jpg" })
  @IsString({ message: "Le lien du fichier doit être un texte." })
  url!: string;

  @ApiPropertyOptional({ example: "lookbook.jpg" })
  @IsOptional()
  @IsString({ message: "Le nom du fichier doit être un texte." })
  @MaxLength(160, { message: "Le nom du fichier est trop long." })
  name?: string;

  @ApiPropertyOptional({ example: "image/jpeg" })
  @IsOptional()
  @IsString({ message: "Le type MIME doit être un texte." })
  @MaxLength(120, { message: "Le type MIME est trop long." })
  mimeType?: string;

  @ApiPropertyOptional({ example: 240000 })
  @IsOptional()
  @IsInt({ message: "La taille du fichier doit être un nombre entier." })
  @Min(1, { message: "La taille du fichier est invalide." })
  sizeBytes?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt({ message: "L'ordre du fichier doit être un nombre entier." })
  @Min(0, { message: "L'ordre du fichier est invalide." })
  order?: number;
}

export class CreatePublicationDto {
  @ApiProperty({ enum: PublicationType, example: PublicationType.PROJECT })
  @IsEnum(PublicationType, { message: "Choisissez un type de publication valide." })
  type!: PublicationType;

  @ApiProperty({ example: "Recherche styliste pour clip culturel" })
  @IsString({ message: "Le titre est requis." })
  @MaxLength(160, { message: "Le titre doit rester court et clair." })
  title!: string;

  @ApiProperty({ example: "Nous préparons un clip à Kinshasa et recherchons un styliste disponible en septembre." })
  @IsString({ message: "Le contenu est requis." })
  @MaxLength(12000, { message: "Le contenu est trop long." })
  content!: string;

  @ApiPropertyOptional({ enum: PublicationAudience, example: PublicationAudience.MEMBERS })
  @IsOptional()
  @IsEnum(PublicationAudience, { message: "Choisissez une audience valide." })
  audience?: PublicationAudience;

  @ApiPropertyOptional({ example: "Mode & stylisme" })
  @IsOptional()
  @IsString({ message: "La catégorie doit être un texte." })
  @MaxLength(80, { message: "La catégorie est trop longue." })
  category?: string;

  @ApiPropertyOptional({ example: "Mode, couture & stylisme" })
  @IsOptional()
  @IsString({ message: "La discipline doit être un texte." })
  @MaxLength(120, { message: "La discipline est trop longue." })
  discipline?: string;

  @ApiPropertyOptional({ example: "Congo RDC" })
  @IsOptional()
  @IsString({ message: "Le pays doit être un texte." })
  @MaxLength(90, { message: "Le pays est trop long." })
  country?: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @IsString({ message: "La ville doit être un texte." })
  @MaxLength(90, { message: "La ville est trop longue." })
  city?: string;

  @ApiPropertyOptional({ example: ["clip", "stylisme", "Kinshasa"] })
  @IsOptional()
  @IsArray({ message: "Les mots-clés doivent être une liste." })
  @ArrayMaxSize(12, { message: "Gardez au maximum 12 mots-clés." })
  @IsString({ each: true, message: "Chaque mot-clé doit être un texte." })
  tags?: string[];

  @ApiPropertyOptional({ example: "https://portfolio.example.com/projet" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Entrez un lien valide, par exemple https://monsite.com." })
  linkUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/cover.jpg" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsUrl({}, { message: "Le lien de l'image principale n'est pas valide." })
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: "group_kinshasa_mode" })
  @IsOptional()
  @IsString({ message: "Le groupe doit être un texte." })
  @MaxLength(120, { message: "Le groupe est invalide." })
  groupId?: string;

  @ApiPropertyOptional({ example: "2026-09-30T23:59:59.000Z" })
  @IsOptional()
  @IsDateString({}, { message: "Entrez une date d'échéance valide." })
  opportunityDeadline?: string;

  @ApiPropertyOptional({ example: "Kinshasa ou à distance" })
  @IsOptional()
  @IsString({ message: "Le lieu doit être un texte." })
  @MaxLength(120, { message: "Le lieu est trop long." })
  opportunityLocation?: string;

  @ApiPropertyOptional({ example: "300-700 USD" })
  @IsOptional()
  @IsString({ message: "Le budget doit être un texte." })
  @MaxLength(80, { message: "Le budget est trop long." })
  budgetRange?: string;

  @ApiPropertyOptional({ example: "contact@cca.africa" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsEmail({}, { message: "Entrez une adresse e-mail de contact valide." })
  contactEmail?: string;

  @ApiPropertyOptional({ example: "2026-10-15T23:59:59.000Z" })
  @IsOptional()
  @IsDateString({}, { message: "Entrez une date d'expiration valide." })
  expiresAt?: string;

  @ApiPropertyOptional({ type: [PublicationAttachmentDto] })
  @IsOptional()
  @IsArray({ message: "Les fichiers doivent être une liste." })
  @ArrayMaxSize(10, { message: "Vous pouvez joindre au maximum 10 fichiers." })
  @ValidateNested({ each: true })
  @Type(() => PublicationAttachmentDto)
  attachments?: PublicationAttachmentDto[];

  @ApiPropertyOptional({ example: true, description: "false permet d'enregistrer un brouillon." })
  @IsOptional()
  @IsBoolean({ message: "Le statut de publication doit être vrai ou faux." })
  publishNow?: boolean;
}
