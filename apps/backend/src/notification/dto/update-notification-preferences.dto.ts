import { ApiProperty } from "@nestjs/swagger";
import { NotificationFrequency, NotificationType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, ValidateNested } from "class-validator";

export class NotificationPreferenceItemDto {
  @ApiProperty({ enum: NotificationType, example: NotificationType.OPPORTUNITY })
  @IsEnum(NotificationType, { message: "Choisissez un type de notification valide." })
  type!: NotificationType;

  @ApiProperty({ example: true })
  @IsBoolean({ message: "Le canal plateforme doit être activé ou désactivé." })
  platform!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean({ message: "Le canal e-mail doit être activé ou désactivé." })
  email!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean({ message: "Le canal WhatsApp doit être activé ou désactivé." })
  whatsapp!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean({ message: "Le canal push doit être activé ou désactivé." })
  push!: boolean;

  @ApiProperty({ enum: NotificationFrequency, example: NotificationFrequency.IMMEDIATE })
  @IsEnum(NotificationFrequency, { message: "Choisissez une fréquence de notification valide." })
  frequency!: NotificationFrequency;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ type: [NotificationPreferenceItemDto] })
  @IsArray({ message: "Envoyez une liste de préférences." })
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  preferences!: NotificationPreferenceItemDto[];
}
