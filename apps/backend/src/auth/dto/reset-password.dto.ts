import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  @MaxLength(254, { message: "L'adresse e-mail est trop longue." })
  email!: string;

  @ApiProperty({ example: "482913" })
  @IsString({ message: "Le code de vérification est requis" })
  @Matches(/^\d{6}$/, { message: "Le code de vérification doit contenir 6 chiffres" })
  code!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le nouveau mot de passe est requis" })
  @MaxLength(128, { message: "Le nouveau mot de passe est trop long." })
  password!: string;
}
