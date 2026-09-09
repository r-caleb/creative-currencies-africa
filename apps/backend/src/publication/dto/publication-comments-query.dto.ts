import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PublicationCommentsQueryDto {
  @ApiPropertyOptional({ example: "2026-09-09T09:30:00.000Z|comment_id" })
  @IsOptional()
  @IsString({ message: "Le curseur de commentaires est invalide." })
  cursor?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être positive." })
  @Max(30, { message: "La limite maximale est 30." })
  limit?: number;
}
