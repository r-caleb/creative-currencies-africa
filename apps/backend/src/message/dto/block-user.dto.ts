import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class BlockUserDto {
  @ApiPropertyOptional({ example: "Messages insistants ou inappropriés." })
  @IsOptional()
  @IsString({ message: "La raison du blocage est invalide." })
  @MaxLength(500, { message: "La raison du blocage est trop longue." })
  reason?: string;
}
