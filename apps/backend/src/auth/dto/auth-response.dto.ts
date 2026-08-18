import { ApiProperty } from "@nestjs/swagger";
import { AccountStatus, AccountType } from "@prisma/client";

class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: AccountType })
  type!: AccountType;

  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  @ApiProperty()
  emailVerified!: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class RegistrationPendingResponseDto {
  @ApiProperty({ example: true })
  verificationRequired!: boolean;

  @ApiProperty({ example: "Un code de vérification a été envoyé par e-mail." })
  message!: string;

  @ApiProperty()
  verificationExpiresAt!: Date;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class ResendVerificationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty()
  verificationExpiresAt!: Date;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}
