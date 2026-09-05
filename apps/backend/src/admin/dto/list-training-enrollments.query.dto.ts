import { ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListTrainingEnrollmentsQueryDto {
  @ApiPropertyOptional({ example: "marketing" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: "Le statut d'inscription est invalide." })
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: "clx..." })
  @IsOptional()
  @IsString()
  trainingId?: string;

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
