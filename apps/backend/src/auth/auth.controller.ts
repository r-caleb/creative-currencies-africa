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
  LogoutResponseDto,
  RefreshResponseDto,
  RegistrationPendingResponseDto,
  ResendVerificationResponseDto,
} from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
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
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
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
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.auth.resendVerification(body);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Se connecter avec l'adresse e-mail et le mot de passe" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "Identifiants invalides" })
  login(@Req() req: AuthedRequest, @Body() body: LoginDto) {
    return this.auth.login(body, this.requestMeta(req));
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Rafraîchir l'access token avec rotation du refresh token" })
  @ApiBody({ type: RefreshDto })
  @ApiOkResponse({ type: RefreshResponseDto })
  refresh(@Req() req: AuthedRequest, @Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken, this.requestMeta(req));
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Révoquer la session liée au refresh token" })
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
