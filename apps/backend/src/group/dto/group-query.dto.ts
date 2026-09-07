import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class GroupQueryDto {
  @ApiPropertyOptional({ example: "mode" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  q?: string;

  @ApiPropertyOptional({ example: "Disciplines" })
  @IsOptional()
  @IsString({ message: "La catégorie doit être un texte." })
  category?: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @IsString({ message: "La ville doit être un texte." })
  city?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean({ message: "Le filtre personnel doit être vrai ou faux." })
  mine?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être positive." })
  @Max(80, { message: "La limite maximale est 80." })
  limit?: number;
}
