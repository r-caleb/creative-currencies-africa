import { ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListOpportunityApplicationsQueryDto {
  @ApiPropertyOptional({ example: "design" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus, { message: "Le statut de candidature est invalide." })
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: "clx..." })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiPropertyOptional({ example: "Design graphique" })
  @IsOptional()
  @IsString()
  discipline?: string;

  @ApiPropertyOptional({ example: "Kinshasa" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
