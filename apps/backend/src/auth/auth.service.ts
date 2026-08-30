import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AccountStatus, AccountType, Gender, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import type { StringValue } from "ms";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser, TokenMeta } from "./auth.types";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { VerifyPasswordResetCodeDto } from "./dto/verify-password-reset-code.dto";
import { VerificationService } from "./verification.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
  ) {}

  async register(input: RegisterDto) {
    const email = this.normalizeEmail(input.email);
    const password = this.assertPassword(input.password);
    const firstName = this.requiredText(input.firstName, "Le prénom est requis");
    const lastName = this.requiredText(input.lastName, "Le nom est requis");
    const type = this.resolveAccountType(input.type);

    const emailExists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      throw new ConflictException("Cette adresse e-mail est déjà utilisée");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await this.createRegistrationWithMemberNumberRetry({
      input,
      email,
      passwordHash,
      firstName,
      lastName,
      type,
    });

    const verification = await this.verification.sendEmailVerificationCode(user);

    return {
      verificationRequired: true,
      message: "Un code de vérification a été envoyé par e-mail.",
      verificationExpiresAt: verification.expiresAt,
      user: this.toAuthUserResponse(user),
    };
  }

  async verifyEmail(input: VerifyEmailDto, meta?: TokenMeta) {
    const email = this.normalizeEmail(input.email);
    const code = this.requiredText(input.code, "Le code de vérification est requis");
    const user = await this.verification.verifyEmailCode(email, code);
    const tokens = await this.issueTokens(user.id, meta);

    return {
      ...tokens,
      user: this.toAuthUserResponse(user),
    };
  }

  async resendVerification(input: ResendVerificationDto) {
    const email = this.normalizeEmail(input.email);
    const verification = await this.verification.resendEmailVerificationCode(email);

    return {
      success: true,
      verificationExpiresAt: verification.expiresAt,
    };
  }

  async forgotPassword(input: ForgotPasswordDto) {
    const email = this.normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        status: true,
      },
    });
    const reset =
      user?.status === AccountStatus.ACTIVE
        ? await this.verification.sendPasswordResetCode(user)
        : { expiresAt: this.verification.passwordResetFallbackExpiresAt() };

    return {
      success: true,
      message: "Si un compte existe, un code de réinitialisation a été envoyé par e-mail.",
      resetExpiresAt: reset.expiresAt,
    };
  }

  async resetPassword(input: ResetPasswordDto) {
    const email = this.normalizeEmail(input.email);
    const code = this.requiredText(input.code, "Le code de réinitialisation est requis");
    const password = this.assertPassword(input.password);
    const user = await this.verification.verifyPasswordResetCode(email, code);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.authSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    });

    return {
      success: true,
      message: "Votre mot de passe a été mis à jour. Vous pouvez vous connecter.",
    };
  }

  async verifyPasswordResetCode(input: VerifyPasswordResetCodeDto) {
    const email = this.normalizeEmail(input.email);
    const code = this.requiredText(input.code, "Le code de réinitialisation est requis");
    await this.verification.checkPasswordResetCode(email, code);

    return {
      success: true,
      message: "Code vérifié. Vous pouvez choisir un nouveau mot de passe.",
    };
  }

  async login(input: LoginDto, meta?: TokenMeta) {
    const email = this.normalizeEmail(input.email);
    const password = this.requiredText(input.password, "Le mot de passe est requis");

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Email ou mot de passe incorrect.");
    }

    if (!user.emailVerifiedAt || user.status === AccountStatus.PENDING) {
      throw new ForbiddenException("Veuillez vérifier votre adresse e-mail avant de vous connecter");
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Ce compte n'est pas accessible pour le moment.");
    }

    const passwordOk = await argon2.verify(user.passwordHash, password);
    if (!passwordOk) {
      throw new UnauthorizedException("Email ou mot de passe incorrect.");
    }

    const tokens = await this.issueTokens(user.id, {
      ...meta,
      deviceId: input.deviceId ?? meta?.deviceId,
    });

    return {
      ...tokens,
      user: this.toAuthUserResponse(user),
    };
  }

  async me(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: true,
        organizationProfile: true,
        partnerProfile: true,
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    return {
      user: this.toAuthUserResponse(user),
      profile: user.profile,
      organizationProfile: user.organizationProfile,
      partnerProfile: user.partnerProfile,
    };
  }

  async refresh(refreshToken: string, meta?: TokenMeta) {
    const token = this.requiredText(refreshToken, "Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    const payload = await this.verifyRefreshToken(token);

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException("Votre connexion a expiré. Connectez-vous à nouveau.");
    }

    const currentOk = await argon2.verify(session.refreshTokenHash, token);
    const previousStillAccepted =
      !!session.previousHash &&
      !!session.rotatedAt &&
      Date.now() - session.rotatedAt.getTime() <= this.refreshGraceMs() &&
      (await argon2.verify(session.previousHash, token));

    if (!currentOk && !previousStillAccepted) {
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    const accessToken = await this.signAccessToken(session.userId);
    const nextRefreshToken = await this.signRefreshToken(session.userId, session.id);
    const nextHash = await argon2.hash(nextRefreshToken, { type: argon2.argon2id });

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: nextHash,
        previousHash: session.refreshTokenHash,
        rotatedAt: new Date(),
        deviceId: meta?.deviceId ?? session.deviceId,
        userAgent: meta?.userAgent ?? session.userAgent,
        ip: meta?.ip ?? session.ip,
      },
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const token = this.requiredText(refreshToken, "Votre connexion n'est plus valide. Connectez-vous à nouveau.");

    try {
      const payload = await this.verifyRefreshToken(token);
      await this.prisma.authSession.updateMany({
        where: { id: payload.sid, userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  private async issueTokens(userId: string, meta?: TokenMeta) {
    const session = await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash: "TEMP",
        deviceId: meta?.deviceId ?? null,
        userAgent: meta?.userAgent ?? null,
        ip: meta?.ip ?? null,
        expiresAt: this.refreshExpiresAt(),
      },
      select: { id: true },
    });

    const accessToken = await this.signAccessToken(userId);
    const refreshToken = await this.signRefreshToken(userId, session.id);
    const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private signAccessToken(userId: string) {
    return this.jwt.signAsync({ sub: userId });
  }

  private signRefreshToken(userId: string, sessionId: string) {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: (this.config.get<string>("JWT_REFRESH_TTL") ?? "14d") as StringValue,
      },
    );
  }

  private verifyRefreshToken(refreshToken: string): Promise<{ sub: string; sid: string }> {
    return this.jwt.verifyAsync(refreshToken, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
    });
  }

  private refreshExpiresAt() {
    return new Date(Date.now() + this.durationToMs(this.config.get<string>("JWT_REFRESH_TTL") ?? "14d"));
  }

  private refreshGraceMs() {
    return this.durationToMs(this.config.get<string>("JWT_REFRESH_GRACE") ?? "20s");
  }

  private durationToMs(value: string) {
    const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
      throw new BadRequestException(`Durée invalide: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }

  private async createRegistrationWithMemberNumberRetry({
    input,
    email,
    passwordHash,
    firstName,
    lastName,
    type,
  }: {
    input: RegisterDto;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    type: AccountType;
  }) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName,
              phone: this.optionalText(input.phone),
              type,
              status: AccountStatus.PENDING,
            },
          });

          if (type === AccountType.CREATOR || type === AccountType.LEARNER) {
            await tx.creativeProfile.create({
              data: {
                userId: created.id,
                country: this.requiredText(input.country, "Le pays est requis"),
                city: this.requiredText(input.city, "La ville est requise"),
                profession: this.optionalText(input.profession),
                birthDate: input.birthDate ? new Date(input.birthDate) : null,
                gender: input.gender ?? null,
                discipline: this.requiredText(input.discipline, "La discipline principale est requise"),
                otherDiscipline: this.optionalText(input.otherDiscipline),
                bio: this.optionalText(input.bio),
                portfolioUrl: this.optionalText(input.portfolioUrl),
                websiteUrl: this.optionalText(input.websiteUrl),
                avatarUrl: this.optionalText(input.avatarUrl),
                cvUrl: this.optionalText(input.cvUrl),
                memberNumber: await this.generateMemberNumber(),
                skills: Array.isArray(input.skills) ? input.skills.filter(Boolean) : [],
                languages: Array.isArray(input.languages) ? input.languages.filter(Boolean) : [],
                availability: this.optionalText(input.availability),
              },
            });
          }

          if (type === AccountType.ORGANIZATION) {
            await tx.organizationProfile.create({
              data: {
                userId: created.id,
                name: this.requiredText(input.organizationName, "Le nom de l'organisation est requis"),
                legalName: this.optionalText(input.organizationLegalName),
                sector: this.optionalText(input.organizationSector),
                country: this.requiredText(input.country, "Le pays est requis"),
                city: this.requiredText(input.city, "La ville est requise"),
                websiteUrl: this.optionalText(input.websiteUrl),
                description: this.optionalText(input.organizationDescription ?? input.bio),
              },
            });
          }

          if (type === AccountType.PARTNER) {
            await tx.partnerProfile.create({
              data: {
                userId: created.id,
                name: this.requiredText(input.partnerName, "Le nom du partenaire est requis"),
                partnerType: this.requiredText(input.partnerType, "Le type de partenaire est requis"),
                country: this.requiredText(input.country, "Le pays est requis"),
                city: this.optionalText(input.city),
                websiteUrl: this.optionalText(input.websiteUrl),
                description: this.optionalText(input.partnerDescription ?? input.bio),
              },
            });
          }

          return created;
        });
      } catch (error) {
        if (this.isMemberNumberUniqueConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException("Impossible de générer un numéro membre unique. Réessayez dans un instant.");
  }

  private async generateMemberNumber() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const year = new Date().getFullYear();
      const suffix = Math.floor(100000 + Math.random() * 900000);
      const memberNumber = `CCA-${year}-${suffix}`;
      const exists = await this.prisma.creativeProfile.findUnique({
        where: { memberNumber },
        select: { id: true },
      });

      if (!exists) {
        return memberNumber;
      }
    }

    throw new BadRequestException("Impossible de générer un numéro membre unique. Réessayez dans un instant.");
  }

  private isMemberNumberUniqueConflict(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      return false;
    }

    const target = error.meta?.target;
    return Array.isArray(target) ? target.includes("memberNumber") : target === "memberNumber";
  }

  private normalizeEmail(value?: string) {
    const email = this.requiredText(value, "L'adresse e-mail est requise").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("Entrez une adresse e-mail valide.");
    }

    return email;
  }

  private assertPassword(value?: string) {
    const password = this.requiredText(value, "Le mot de passe est requis");
    const missingRules = [
      password.length >= 8 ? "" : "- Au moins 8 caractères",
      /[A-Z]/.test(password) && /[a-z]/.test(password) ? "" : "- Une majuscule et une minuscule",
      /\d/.test(password) ? "" : "- Un chiffre",
      /[^A-Za-z0-9]/.test(password) ? "" : "- Un caractère spécial",
    ].filter(Boolean);

    if (missingRules.length > 0) {
      throw new BadRequestException(`Le mot de passe doit contenir :\n${missingRules.join("\n")}`);
    }

    return password;
  }

  private resolveAccountType(value?: AccountType) {
    const type = value ?? AccountType.LEARNER;
    if (!Object.values(AccountType).includes(type) || type === AccountType.ADMIN) {
      throw new BadRequestException("Choisissez un type de compte valide.");
    }

    return type;
  }

  private requiredText(value: unknown, message: string) {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private optionalText(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private toAuthUserResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    type: AccountType;
    status: AccountStatus;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      type: user.type,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
    };
  }
}
