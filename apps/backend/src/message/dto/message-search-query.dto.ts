import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class MessageSearchQueryDto {
  @ApiPropertyOptional({ example: "portfolio" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  @MaxLength(120, { message: "La recherche est trop longue." })
  q?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 80 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "La limite doit être un nombre." })
  @Min(1, { message: "La limite doit être au moins 1." })
  @Max(80, { message: "La limite ne peut pas dépasser 80." })
  limit?: number;
}
