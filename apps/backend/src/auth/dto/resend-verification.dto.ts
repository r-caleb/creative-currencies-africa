import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail({}, { message: "Entrez une adresse e-mail valide." })
  email!: string;
}
