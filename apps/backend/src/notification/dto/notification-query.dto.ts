import { ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class NotificationQueryDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType, { message: "Choisissez un type de notification valide." })
  type?: NotificationType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean({ message: "Le filtre non lu doit être valide." })
  unreadOnly?: boolean;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 80 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "La limite doit être un nombre." })
  @Min(1, { message: "La limite doit être au moins 1." })
  @Max(80, { message: "La limite ne peut pas dépasser 80." })
  limit?: number;
}
