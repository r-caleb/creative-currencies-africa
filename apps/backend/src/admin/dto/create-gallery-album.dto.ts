import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GalleryAlbumCategory } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { CreateGalleryPhotoDto } from "./create-gallery-photo.dto";

export class CreateGalleryAlbumDto {
  @ApiProperty({ example: "Backstage Creative Currencies 2026" })
  @IsString({ message: "Le titre de l'album doit être un texte." })
  @MaxLength(160, { message: "Le titre de l'album est trop long." })
  title!: string;

  @ApiPropertyOptional({ example: "Sélection officielle des coulisses, rencontres et moments forts." })
  @IsOptional()
  @IsString({ message: "La description de l'album doit être un texte." })
  description?: string;

  @ApiPropertyOptional({ enum: GalleryAlbumCategory, example: GalleryAlbumCategory.BACKSTAGE })
  @IsOptional()
  @IsEnum(GalleryAlbumCategory, { message: "Choisissez une catégorie de galerie valide." })
  category?: GalleryAlbumCategory;

  @ApiPropertyOptional({ example: "/assets/gallery/backstage-cover.jpg" })
  @IsOptional()
  @IsString({ message: "L'image de couverture doit être un chemin ou une URL valide." })
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: "Le champ accueil doit être vrai ou faux." })
  featuredOnLanding?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "Le numéro d'affichage doit être un nombre entier." })
  @Min(0, { message: "Le numéro d'affichage ne peut pas être négatif." })
  sortOrder?: number;

  @ApiPropertyOptional({ type: [CreateGalleryPhotoDto] })
  @IsOptional()
  @IsArray({ message: "Les photos doivent être envoyées sous forme de liste." })
  @ValidateNested({ each: true })
  @Type(() => CreateGalleryPhotoDto)
  photos?: CreateGalleryPhotoDto[];
}
