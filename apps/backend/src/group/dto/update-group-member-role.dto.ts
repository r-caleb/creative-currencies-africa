import { ApiProperty } from "@nestjs/swagger";
import { CommunityGroupRole } from "@prisma/client";
import { IsIn } from "class-validator";

export class UpdateGroupMemberRoleDto {
  @ApiProperty({ enum: [CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], example: CommunityGroupRole.MODERATOR })
  @IsIn([CommunityGroupRole.MEMBER, CommunityGroupRole.MODERATOR], { message: "Choisissez un rôle valide." })
  role!: CommunityGroupRole;
}
