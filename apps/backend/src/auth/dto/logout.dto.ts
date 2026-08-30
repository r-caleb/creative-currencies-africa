import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LogoutDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString({ message: "Votre connexion n'est plus valide. Connectez-vous à nouveau." })
  refreshToken!: string;
}
