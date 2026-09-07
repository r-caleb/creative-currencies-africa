import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "Ancien@2026" })
  @IsString({ message: "Le mot de passe actuel est requis" })
  @MaxLength(128, { message: "Le mot de passe actuel est trop long." })
  currentPassword!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le nouveau mot de passe est requis" })
  @MaxLength(128, { message: "Le nouveau mot de passe est trop long." })
  newPassword!: string;
}
