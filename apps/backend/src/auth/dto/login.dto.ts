import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString({ message: "Le mot de passe est requis" })
  password!: string;

  @ApiPropertyOptional({ example: "macbook-pro-chrome" })
  @IsOptional()
  @IsString({ message: "Nous n'avons pas pu reconnaître cet appareil. Réessayez." })
  deviceId?: string;
}
