import { ApiPropertyOptional } from "@nestjs/swagger";
import { AccountEvolutionRequestStatus, AccountType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListAccountEvolutionRequestsQueryDto {
  @ApiPropertyOptional({ example: "kinshasa" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: AccountEvolutionRequestStatus })
  @IsOptional()
  @IsEnum(AccountEvolutionRequestStatus)
  status?: AccountEvolutionRequestStatus;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  requestedType?: AccountType;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
