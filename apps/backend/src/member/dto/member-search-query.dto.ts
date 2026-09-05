import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class MemberSearchQueryDto {
  @ApiPropertyOptional({ example: "mode Kinshasa" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  @MaxLength(120, { message: "La recherche est trop longue." })
  q?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 8 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "La limite doit être un nombre." })
  @Min(1, { message: "La limite doit être au moins 1." })
  @Max(8, { message: "La limite ne peut pas dépasser 8 par catégorie." })
  limit?: number;
}
