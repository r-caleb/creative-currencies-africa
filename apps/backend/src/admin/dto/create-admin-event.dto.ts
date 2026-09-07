import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EventType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAdminEventDto {
  @ApiProperty({ example: "Creative Currencies Africa 2026" })
  @IsString({ message: "Le titre de l'événement doit être un texte." })
  @MaxLength(160, { message: "Le titre de l'événement est trop long." })
  title!: string;

  @ApiProperty({ example: "Journées de formation, workshops et panel talk autour des industries créatives." })
  @IsString({ message: "La description de l'événement doit être un texte." })
  description!: string;

  @ApiPropertyOptional({ enum: EventType, example: EventType.WORKSHOP })
  @IsOptional()
  @IsEnum(EventType, { message: "Choisissez un type d'événement valide." })
  type?: EventType;

  @ApiProperty({ example: "2026-09-02T08:00:00.000Z" })
  @IsDateString({}, { message: "La date de début doit être une date valide." })
  startsAt!: string;

  @ApiProperty({ example: "2026-09-05T16:00:00.000Z" })
  @IsDateString({}, { message: "La date de fin doit être une date valide." })
  endsAt!: string;

  @ApiProperty({ example: "Silikin Village, Kinshasa" })
  @IsString({ message: "Le lieu doit être un texte." })
  @MaxLength(180, { message: "Le lieu est trop long." })
  location!: string;

  @ApiPropertyOptional({ example: "/assets/cc-event-banner.png" })
  @IsOptional()
  @IsString({ message: "L'image doit être un chemin ou une URL valide." })
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: "https://wa.me/243988192765" })
  @IsOptional()
  @IsString({ message: "Le lien WhatsApp doit être un texte." })
  whatsappUrl?: string;

  @ApiPropertyOptional({ example: "https://facebook.com/events/creative-currencies-africa" })
  @IsOptional()
  @IsString({ message: "Le lien Facebook doit être un texte." })
  facebookEventUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: "Le statut publié doit être vrai ou faux." })
  published?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: "Le champ accueil doit être vrai ou faux." })
  featuredOnLanding?: boolean;
}
