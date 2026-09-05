import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CommunityGroupInvitationStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewGroupJoinRequestDto {
  @ApiProperty({
    enum: [CommunityGroupInvitationStatus.ACCEPTED, CommunityGroupInvitationStatus.DECLINED],
    example: CommunityGroupInvitationStatus.ACCEPTED,
  })
  @IsIn([CommunityGroupInvitationStatus.ACCEPTED, CommunityGroupInvitationStatus.DECLINED], {
    message: "Choisissez d'accepter ou de refuser la demande.",
  })
  status!: CommunityGroupInvitationStatus;

  @ApiPropertyOptional({ example: "Profil validé pour rejoindre le groupe." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
