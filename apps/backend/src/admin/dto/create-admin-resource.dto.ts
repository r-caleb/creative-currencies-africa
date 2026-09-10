import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResourceAccessLevel, ResourceType } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAdminResourceDto {
  @ApiProperty({ example: "Syllabus - Business of Fashion" })
  @IsString({ message: "Le titre de la ressource doit être un texte." })
  @MaxLength(160, { message: "Le titre de la ressource est trop long." })
  title!: string;

  @ApiPropertyOptional({ example: "Support pédagogique remis aux participants de la formation." })
  @IsOptional()
  @IsString({ message: "La description doit être un texte." })
  description?: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.PDF })
  @IsEnum(ResourceType, { message: "Choisissez un type de ressource valide." })
  type!: ResourceType;

  @ApiProperty({ example: "/assets/resources/business-of-fashion.pdf" })
  @IsString({ message: "Le fichier doit être un chemin ou une URL valide." })
  url!: string;

  @ApiPropertyOptional({ enum: ResourceAccessLevel, example: ResourceAccessLevel.MEMBERS })
  @IsOptional()
  @IsEnum(ResourceAccessLevel, { message: "Choisissez un niveau d'accès valide." })
  accessLevel?: ResourceAccessLevel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: "Le champ fil d'actualité doit être vrai ou faux." })
  showInFeed?: boolean;

  @ApiPropertyOptional({ example: "clx-training-id" })
  @IsOptional()
  @IsString({ message: "La formation liée doit être un identifiant valide." })
  trainingId?: string;
}
