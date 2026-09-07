import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePublicationCommentDto {
  @ApiProperty({ example: "Je suis disponible, pouvons-nous échanger sur le brief ?" })
  @IsString({ message: "Le commentaire est requis." })
  @MaxLength(3000, { message: "Le commentaire est trop long." })
  content!: string;

  @ApiPropertyOptional({ example: "comment_parent_id" })
  @IsOptional()
  @IsString({ message: "La réponse ciblée est invalide." })
  parentId?: string;
}
