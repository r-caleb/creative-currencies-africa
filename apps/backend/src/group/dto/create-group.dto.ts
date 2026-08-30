import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CommunityGroupVisibility } from "@prisma/client";
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class CreateGroupDto {
  @ApiProperty({ example: "Mode, couture & stylisme Kinshasa" })
  @IsString({ message: "Le nom du groupe est requis." })
  @MaxLength(90, { message: "Le nom du groupe doit rester court." })
  name!: string;

  @ApiProperty({ example: "Disciplines" })
  @IsString({ message: "La catégorie est requise." })
  @MaxLength(80, { message: "La catégorie est trop longue." })
  category!: string;

  @ApiProperty({ example: "Un espace pour stylistes, couturiers, mannequins, marques et ateliers." })
  @IsString({ message: "La description du groupe est requise." })
  @MaxLength(800, { message: "La description du groupe est trop longue." })
  description!: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "La ville doit être un texte." })
  @MaxLength(90, { message: "La ville est trop longue." })
  city?: string;

  @ApiPropertyOptional({ example: "Congo RDC" })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le pays doit être un texte." })
  @MaxLength(90, { message: "Le pays est trop long." })
  country?: string;

  @ApiPropertyOptional({ example: ["Mode", "Textile", "Défilé"] })
  @IsOptional()
  @IsArray({ message: "Les mots-clés doivent être une liste." })
  @ArrayMaxSize(8, { message: "Gardez au maximum 8 mots-clés." })
  @IsString({ each: true, message: "Chaque mot-clé doit être un texte." })
  tags?: string[];

  @ApiPropertyOptional({ enum: CommunityGroupVisibility, example: CommunityGroupVisibility.MEMBERS })
  @IsOptional()
  @IsEnum(CommunityGroupVisibility, { message: "Choisissez une visibilité valide." })
  visibility?: CommunityGroupVisibility;
}
