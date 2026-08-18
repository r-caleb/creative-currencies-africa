import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountType, Gender } from "@prisma/client";
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "aicha.kabulo@email.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Creative@2026" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "Aïcha" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Kabulo" })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: "+243 898 192 765" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CREATOR })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ example: "République démocratique du Congo" })
  @IsString()
  country!: string;

  @ApiProperty({ example: "Kinshasa" })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: "Photographe" })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: "2001-08-20" })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.CREATOR || body.type === AccountType.LEARNER)
  @ApiPropertyOptional({ example: "Photographie" })
  @IsString()
  discipline?: string;

  @ApiPropertyOptional({ example: "Art numérique" })
  @IsOptional()
  @IsString()
  otherDiscipline?: string;

  @ApiPropertyOptional({
    example: "Je développe une pratique photographique autour de la mode, de la mémoire et des scènes urbaines.",
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: "https://portfolio.example.com/aicha" })
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: "https://aicha.example.com" })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/aicha.jpg" })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/cv/aicha.pdf" })
  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @ApiPropertyOptional({ example: ["Portrait", "Retouche", "Storytelling visuel"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: ["Français", "Lingala"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ example: "Disponible pour workshops, commandes photo et collaborations culturelles." })
  @IsOptional()
  @IsString()
  availability?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.ORGANIZATION)
  @ApiPropertyOptional({ example: "Studio Photo Kin" })
  @IsString()
  organizationName?: string;

  @ApiPropertyOptional({ example: "Studio Photo Kin SARL" })
  @IsOptional()
  @IsString()
  organizationLegalName?: string;

  @ApiPropertyOptional({ example: "Formation et production audiovisuelle" })
  @IsOptional()
  @IsString()
  organizationSector?: string;

  @ApiPropertyOptional({ example: "Structure culturelle active dans la formation et la production photo." })
  @IsOptional()
  @IsString()
  organizationDescription?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Fondation Culture & Impact" })
  @IsString()
  partnerName?: string;

  @ValidateIf((body: RegisterDto) => body.type === AccountType.PARTNER)
  @ApiPropertyOptional({ example: "Sponsor" })
  @IsString()
  partnerType?: string;

  @ApiPropertyOptional({ example: "Partenaire engagé dans le financement de programmes créatifs." })
  @IsOptional()
  @IsString()
  partnerDescription?: string;
}
