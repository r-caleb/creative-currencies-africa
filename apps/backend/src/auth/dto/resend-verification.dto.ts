import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail()
  email!: string;
}
