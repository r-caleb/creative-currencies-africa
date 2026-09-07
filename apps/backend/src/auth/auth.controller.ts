import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  AuthResponseDto,
  ChangePasswordResponseDto,
  ForgotPasswordResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
  RegistrationPendingResponseDto,
  ResendVerificationResponseDto,
  ResetPasswordResponseDto,
  VerifyPasswordResetCodeResponseDto,
} from "./dto/auth-response.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { VerifyPasswordResetCodeDto } from "./dto/verify-password-reset-code.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthUser } from "./auth.types";

type AuthedRequest = Request & {
  user: AuthUser;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Créer un compte membre Creative Currencies Africa" })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: RegistrationPendingResponseDto })
  register(@Req() req: AuthedRequest, @Body() body: RegisterDto) {
    return this.auth.register(body, this.requestMeta(req));
  }

  @Post("verify-email")
  @HttpCode(200)
  @ApiOperation({ summary: "Vérifier l'e-mail avec le code OTP et ouvrir une session" })
  @ApiBody({ type: VerifyEmailDto })
  @ApiOkResponse({ type: AuthResponseDto })
  verifyEmail(@Req() req: AuthedRequest, @Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body, this.requestMeta(req));
  }

  @Post("resend-verification")
  @HttpCode(200)
  @ApiOperation({ summary: "Renvoyer le code de vérification e-mail" })
  @ApiBody({ type: ResendVerificationDto })
  @ApiOkResponse({ type: ResendVerificationResponseDto })
  resendVerification(@Req() req: AuthedRequest, @Body() body: ResendVerificationDto) {
    return this.auth.resendVerification(body, this.requestMeta(req));
  }

  @Post("forgot-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Demander un code OTP de réinitialisation du mot de passe" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ type: ForgotPasswordResponseDto })
  forgotPassword(@Req() req: AuthedRequest, @Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body, this.requestMeta(req));
  }

  @Post("reset-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Réinitialiser le mot de passe avec un code OTP" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  resetPassword(@Req() req: AuthedRequest, @Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body, this.requestMeta(req));
  }

  @Post("verify-password-reset-code")
  @HttpCode(200)
  @ApiOperation({ summary: "Vérifier le code OTP avant de choisir un nouveau mot de passe" })
  @ApiBody({ type: VerifyPasswordResetCodeDto })
  @ApiOkResponse({ type: VerifyPasswordResetCodeResponseDto })
  verifyPasswordResetCode(@Req() req: AuthedRequest, @Body() body: VerifyPasswordResetCodeDto) {
    return this.auth.verifyPasswordResetCode(body, this.requestMeta(req));
  }

  @Post("change-password")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Changer le mot de passe de l'utilisateur connecté" })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: AuthedRequest, @Body() body: ChangePasswordDto) {
    return this.auth.changePassword(req.user, body);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Se connecter avec l'adresse e-mail et le mot de passe" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "Email ou mot de passe incorrect." })
  login(@Req() req: AuthedRequest, @Body() body: LoginDto) {
    return this.auth.login(body, this.requestMeta(req));
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Renouveler la session de l'utilisateur connecté" })
  @ApiBody({ type: RefreshDto })
  @ApiOkResponse({ type: RefreshResponseDto })
  refresh(@Req() req: AuthedRequest, @Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken, this.requestMeta(req));
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Déconnecter l'utilisateur" })
  @ApiBody({ type: LogoutDto })
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Body() body: LogoutDto) {
    return this.auth.logout(body.refreshToken);
  }

  @Get("me")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Lire l'utilisateur connecté et son profil" })
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.user);
  }

  private requestMeta(req: AuthedRequest) {
    const userAgent = req.headers["user-agent"];

    return {
      userAgent: Array.isArray(userAgent) ? userAgent.join(" ") : userAgent,
      ip: req.ip,
    };
  }
}
