import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountEvolutionRequestStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAccountEvolutionRequestDto {
  @ApiProperty({
    enum: [AccountEvolutionRequestStatus.APPROVED, AccountEvolutionRequestStatus.REJECTED, AccountEvolutionRequestStatus.CANCELLED],
    example: AccountEvolutionRequestStatus.APPROVED,
  })
  @IsEnum(AccountEvolutionRequestStatus)
  status!: AccountEvolutionRequestStatus;

  @ApiPropertyOptional({ example: "Portfolio validé par l'équipe CCA." })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
