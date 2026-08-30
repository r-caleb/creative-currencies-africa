import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateDisciplineDto {
  @ApiPropertyOptional({ example: "Arts visuels" })
  @IsOptional()
  @IsString({ message: "Le nom de la discipline doit être un texte." })
  name?: string;

  @ApiPropertyOptional({ example: "arts-visuels" })
  @IsOptional()
  @IsString({ message: "Le slug doit être un texte." })
  slug?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut actif doit être vrai ou faux." })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt({ message: "L'ordre d'affichage doit être un nombre entier." })
  @Min(0, { message: "L'ordre d'affichage ne peut pas être négatif." })
  sortOrder?: number;
}
