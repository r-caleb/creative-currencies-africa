import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class EnrollTrainingDto {
  @ApiPropertyOptional({ example: "Je souhaite suivre cette formation pour renforcer mon portfolio et mieux structurer mon projet." })
  @IsOptional()
  @IsString({ message: "La motivation doit être un texte." })
  motivation?: string;

  @ApiPropertyOptional({ example: "+243 000 000 000" })
  @IsOptional()
  @IsString({ message: "Le téléphone doit être un texte." })
  @MaxLength(40, { message: "Le téléphone est trop long." })
  phone?: string;
}
