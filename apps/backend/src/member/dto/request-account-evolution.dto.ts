import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class RequestAccountEvolutionDto {
  @ApiProperty({
    enum: [AccountType.CREATOR],
    example: AccountType.CREATOR,
    description: "Statut demandé. Pour cette version, seule la demande créateur est ouverte côté membre.",
  })
  @IsEnum(AccountType)
  requestedType!: AccountType;

  @ApiPropertyOptional({
    example: "Je souhaite faire valider mon profil créateur car je présente déjà un portfolio actif.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  motivation?: string;

  @ApiPropertyOptional({ example: "https://portfolio.exemple.com" })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(400)
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.creativecurrencies.africa/cv/caleb.pdf" })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(400)
  cvUrl?: string;
}
