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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "Le numéro d'affichage doit être un nombre entier." })
  @Min(1, { message: "Le numéro d'affichage doit être supérieur ou égal à 1." })
  sortOrder?: number;
}
