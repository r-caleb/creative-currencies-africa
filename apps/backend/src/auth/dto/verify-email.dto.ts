import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "482913" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "Le code de vérification doit contenir 6 chiffres" })
  code!: string;
}
