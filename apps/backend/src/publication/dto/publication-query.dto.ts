import { ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationAudience, PublicationStatus, PublicationType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PublicationQueryDto {
  @ApiPropertyOptional({ example: "styliste" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  q?: string;

  @ApiPropertyOptional({ enum: PublicationType, example: PublicationType.PROJECT })
  @IsOptional()
  @IsEnum(PublicationType, { message: "Choisissez un type de publication valide." })
  type?: PublicationType;

  @ApiPropertyOptional({ enum: PublicationAudience, example: PublicationAudience.MEMBERS })
  @IsOptional()
  @IsEnum(PublicationAudience, { message: "Choisissez une audience valide." })
  audience?: PublicationAudience;

  @ApiPropertyOptional({ enum: PublicationStatus, example: PublicationStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(PublicationStatus, { message: "Choisissez un statut de publication valide." })
  status?: PublicationStatus;

  @ApiPropertyOptional({ example: "Mode & stylisme" })
  @IsOptional()
  @IsString({ message: "La catégorie doit être un texte." })
  category?: string;

  @ApiPropertyOptional({ example: "opportunities" })
  @IsOptional()
  @IsString({ message: "La destination doit être un texte." })
  destination?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean({ message: "Le filtre personnel doit être vrai ou faux." })
  mine?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean({ message: "Le format paginé doit être vrai ou faux." })
  paginated?: boolean;

  @ApiPropertyOptional({ example: "2026-08-29T10:30:00.000Z|publication_id" })
  @IsOptional()
  @IsString({ message: "Le curseur de pagination est invalide." })
  cursor?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être positive." })
  @Max(80, { message: "La limite maximale est 80." })
  limit?: number;
}
