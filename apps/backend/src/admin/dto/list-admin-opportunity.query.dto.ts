import { ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityStatus, OpportunityType } from "@prisma/client";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListAdminOpportunityQueryDto {
  @ApiPropertyOptional({ example: "résidence" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: OpportunityType })
  @IsOptional()
  @IsEnum(OpportunityType, { message: "Le type d'opportunité est invalide." })
  type?: OpportunityType;

  @ApiPropertyOptional({ enum: OpportunityStatus })
  @IsOptional()
  @IsEnum(OpportunityStatus, { message: "Le statut d'opportunité est invalide." })
  status?: OpportunityStatus;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  published?: string;
}
