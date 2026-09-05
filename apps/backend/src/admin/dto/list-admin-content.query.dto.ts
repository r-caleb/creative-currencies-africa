import { ApiPropertyOptional } from "@nestjs/swagger";
import { EventType, TrainingStatus } from "@prisma/client";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListAdminContentQueryDto {
  @ApiPropertyOptional({ example: "marketing" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: TrainingStatus })
  @IsOptional()
  @IsEnum(TrainingStatus, { message: "Le statut de formation est invalide." })
  status?: TrainingStatus;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType, { message: "Le type d'événement est invalide." })
  type?: EventType;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  published?: string;
}
