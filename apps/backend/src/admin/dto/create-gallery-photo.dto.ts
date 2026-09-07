import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateGalleryPhotoDto {
  @ApiProperty({ example: "/assets/gallery/workshop-kinshasa-01.jpg" })
  @IsString({ message: "L'image doit être un chemin ou une URL valide." })
  imageUrl!: string;

  @ApiPropertyOptional({ example: "Workshop photographie" })
  @IsOptional()
  @IsString({ message: "Le titre de la photo doit être un texte." })
  @MaxLength(160, { message: "Le titre de la photo est trop long." })
  title?: string;

  @ApiPropertyOptional({ example: "Moment de pratique pendant l'atelier Creative Currencies Africa." })
  @IsOptional()
  @IsString({ message: "La légende doit être un texte." })
  caption?: string;

  @ApiPropertyOptional({ example: "Participants pendant un workshop Creative Currencies Africa" })
  @IsOptional()
  @IsString({ message: "Le texte alternatif doit être un texte." })
  altText?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "Le numéro d'affichage doit être un nombre entier." })
  @Min(0, { message: "Le numéro d'affichage ne peut pas être négatif." })
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;
}
