import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class GroupMemberCandidateQueryDto {
  @ApiPropertyOptional({ example: "Amina photographe Kinshasa" })
  @IsOptional()
  @IsString({ message: "La recherche doit être un texte." })
  q?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La limite doit être un nombre entier." })
  @Min(1, { message: "La limite doit être positive." })
  @Max(20, { message: "La limite maximale est 20." })
  limit?: number;
}
