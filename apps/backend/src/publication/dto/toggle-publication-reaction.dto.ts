import { ApiPropertyOptional } from "@nestjs/swagger";
import { PublicationReactionType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class TogglePublicationReactionDto {
  @ApiPropertyOptional({ enum: PublicationReactionType, example: PublicationReactionType.LIKE })
  @IsOptional()
  @IsEnum(PublicationReactionType, { message: "Choisissez une réaction valide." })
  type?: PublicationReactionType;
}
