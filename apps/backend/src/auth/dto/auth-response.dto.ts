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

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Si un compte existe, un code de réinitialisation a été envoyé par e-mail." })
  message!: string;

  @ApiProperty()
  resetExpiresAt!: Date;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Votre mot de passe a été mis à jour. Vous pouvez vous connecter." })
  message!: string;
}

export class VerifyPasswordResetCodeResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Code vérifié. Vous pouvez choisir un nouveau mot de passe." })
  message!: string;
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
