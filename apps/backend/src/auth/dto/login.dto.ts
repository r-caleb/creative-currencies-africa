import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "macbook-pro-chrome" })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
