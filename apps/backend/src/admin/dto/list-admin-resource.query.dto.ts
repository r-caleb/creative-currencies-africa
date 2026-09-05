import { ApiPropertyOptional } from "@nestjs/swagger";
import { ResourceAccessLevel, ResourceType } from "@prisma/client";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";

export class ListAdminResourceQueryDto {
  @ApiPropertyOptional({ example: "syllabus" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType, { message: "Le type de ressource est invalide." })
  type?: ResourceType;

  @ApiPropertyOptional({ enum: ResourceAccessLevel })
  @IsOptional()
  @IsEnum(ResourceAccessLevel, { message: "Le niveau d'accès est invalide." })
  accessLevel?: ResourceAccessLevel;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  published?: string;
}
