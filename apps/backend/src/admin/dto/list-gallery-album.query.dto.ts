import { ApiPropertyOptional } from "@nestjs/swagger";
import { GalleryAlbumCategory } from "@prisma/client";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListGalleryAlbumQueryDto {
  @ApiPropertyOptional({ example: "backstage" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: GalleryAlbumCategory })
  @IsOptional()
  @IsEnum(GalleryAlbumCategory, { message: "La catégorie de galerie est invalide." })
  category?: GalleryAlbumCategory;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  published?: string;
}
