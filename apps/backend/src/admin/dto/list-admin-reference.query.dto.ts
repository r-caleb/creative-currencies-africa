import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBooleanString, IsOptional, IsString } from "class-validator";

export class ListAdminReferenceQueryDto {
  @ApiPropertyOptional({ example: "photo" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBooleanString()
  published?: string;
}
