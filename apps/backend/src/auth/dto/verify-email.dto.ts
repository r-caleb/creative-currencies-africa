import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  email!: string;

  @ApiProperty({ example: "482913" })
  @IsString({ message: "Le code de vérification est requis" })
  @Matches(/^\d{6}$/, { message: "Le code de vérification doit contenir 6 chiffres" })
  code!: string;
}
