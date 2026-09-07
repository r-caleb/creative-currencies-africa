import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListAdminAuditLogQueryDto {
  @ApiPropertyOptional({ example: "MESSAGE_DELETED" })
  @IsOptional()
  @IsString({ message: "L'action doit être un texte." })
  action?: string;

  @ApiPropertyOptional({ example: "DirectMessage" })
  @IsOptional()
  @IsString({ message: "Le type d'entité doit être un texte." })
  entityType?: string;

  @ApiPropertyOptional({ example: "50" })
  @IsOptional()
  @IsString({ message: "La limite doit être transmise sous forme de texte." })
  limit?: string;
}
