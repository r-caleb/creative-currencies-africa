import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class SharePublicationDto {
  @ApiPropertyOptional({ example: "Très utile pour les créateurs qui préparent une candidature." })
  @IsOptional()
  @IsString({ message: "Le message de partage est invalide." })
  @MaxLength(700, { message: "Le message de partage est trop long." })
  content?: string;
}
