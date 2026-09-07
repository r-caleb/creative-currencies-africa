import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStatus, OpportunityType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAdminOpportunityDto {
  @ApiProperty({ example: "Africa Design Fund" })
  @IsString({ message: "Le titre de l'opportunité doit être un texte." })
  @MaxLength(160, { message: "Le titre de l'opportunité est trop long." })
  title!: string;

  @ApiProperty({ example: "Appel à projets pour créateurs visuels, designers et collectifs." })
  @IsString({ message: "La description de l'opportunité doit être un texte." })
  description!: string;

  @ApiProperty({ enum: OpportunityType, example: OpportunityType.FUNDING })
  @IsEnum(OpportunityType, { message: "Choisissez un type d'opportunité valide." })
  type!: OpportunityType;

  @ApiPropertyOptional({ enum: OpportunityStatus, example: OpportunityStatus.OPEN })
  @IsOptional()
  @IsEnum(OpportunityStatus, { message: "Choisissez un statut d'opportunité valide." })
  status?: OpportunityStatus;

  @ApiPropertyOptional({ example: "2026-06-15T23:59:00.000Z" })
  @IsOptional()
  @IsDateString({}, { message: "La date limite doit être une date valide." })
  deadline?: string;

  @ApiPropertyOptional({ example: "Afrique francophone" })
  @IsOptional()
  @IsString({ message: "Le lieu doit être un texte." })
  @MaxLength(180, { message: "Le lieu est trop long." })
  location?: string;

  @ApiPropertyOptional({ example: "https://example.com/candidature" })
  @IsOptional()
  @IsString({ message: "Le lien de candidature doit être un texte." })
  eligibilityUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;
}
