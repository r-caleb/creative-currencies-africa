import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CommunityGroupRole } from "@prisma/client";
import { IsIn, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

export class CreateGroupInvitationDto {
  @ApiProperty({ example: "clv0x4k12000008l64r3q8e4m" })
  @IsString({ message: "Choisissez un membre valide." })
  userId!: string;

  @ApiPropertyOptional({ enum: [CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], example: CommunityGroupRole.MEMBER })
  @IsOptional()
  @IsIn([CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], { message: "Choisissez un rôle valide." })
  role?: CommunityGroupRole;

  @ApiPropertyOptional({ example: "Je vous invite à rejoindre ce groupe pour échanger autour du projet." })
  @IsOptional()
  @ValidateIf((_, value) => value !== "")
  @IsString({ message: "Le message d'invitation doit être un texte." })
  @MaxLength(500, { message: "Le message d'invitation est trop long." })
  message?: string;
}
