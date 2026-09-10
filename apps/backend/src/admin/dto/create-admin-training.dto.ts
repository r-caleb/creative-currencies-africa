import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TrainingStatus } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateAdminTrainingDto {
  @ApiProperty({ example: "Marketing digital pour artistes" })
  @IsString({ message: "Le titre de la formation doit être un texte." })
  @MaxLength(160, { message: "Le titre de la formation est trop long." })
  title!: string;

  @ApiProperty({ example: "Un parcours pratique pour aider les créatifs à présenter, vendre et documenter leur travail." })
  @IsString({ message: "La description de la formation doit être un texte." })
  description!: string;

  @ApiPropertyOptional({ example: "2026-09-02T08:00:00.000Z" })
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide." })
  startsAt?: string;

  @ApiPropertyOptional({ example: "2026-09-05T16:00:00.000Z" })
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide." })
  endsAt?: string;

  @ApiPropertyOptional({ example: "Silikin Village, Kinshasa" })
  @IsOptional()
  @IsString({ message: "Le lieu doit être un texte." })
  @MaxLength(180, { message: "Le lieu est trop long." })
  location?: string;

  @ApiPropertyOptional({ example: "/assets/cc-event-flyer.png" })
  @IsOptional()
  @IsString({ message: "L'image doit être un chemin ou une URL valide." })
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt({ message: "La capacité doit être un nombre entier." })
  @Min(1, { message: "La capacité doit être supérieure ou égale à 1." })
  capacity?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt({ message: "Le prix doit être un nombre entier en centimes." })
  @Min(0, { message: "Le prix ne peut pas être négatif." })
  priceCents?: number;

  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @IsString({ message: "La devise doit être un texte." })
  @MaxLength(8, { message: "La devise est trop longue." })
  currency?: string;

  @ApiPropertyOptional({ enum: TrainingStatus, example: TrainingStatus.DRAFT })
  @IsOptional()
  @IsEnum(TrainingStatus, { message: "Choisissez un statut de formation valide." })
  status?: TrainingStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le champ certificat doit être vrai ou faux." })
  certificateEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: "Le champ accueil doit être vrai ou faux." })
  featuredOnLanding?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: "Le champ fil d'actualité doit être vrai ou faux." })
  showInFeed?: boolean;
}
