import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CommunityGroupRole } from "@prisma/client";
import { IsIn, IsOptional, IsString } from "class-validator";

export class AddGroupMemberDto {
  @ApiProperty({ example: "clv0x4k12000008l64r3q8e4m" })
  @IsString({ message: "Choisissez un membre valide." })
  userId!: string;

  @ApiPropertyOptional({ enum: [CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], example: CommunityGroupRole.MEMBER })
  @IsOptional()
  @IsIn([CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], { message: "Choisissez un rôle valide." })
  role?: CommunityGroupRole;
}
