import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  @MaxLength(254, { message: "L'adresse e-mail est trop longue." })
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le mot de passe est requis" })
  @MaxLength(128, { message: "Le mot de passe est trop long." })
  password!: string;

  @ApiPropertyOptional({ example: "macbook-pro-chrome" })
  @IsOptional()
  @IsString({ message: "Nous n'avons pas pu reconnaître cet appareil. Réessayez." })
  @MaxLength(120, { message: "L'identifiant de l'appareil est trop long." })
  deviceId?: string;
}
