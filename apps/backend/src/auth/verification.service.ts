import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccountStatus, VerificationPurpose } from "@prisma/client";
import * as argon2 from "argon2";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async sendEmailVerificationCode(user: {
    id: string;
    email: string;
    firstName: string;
    emailVerifiedAt: Date | null;
  }) {
    if (user.emailVerifiedAt) {
      throw new BadRequestException("Cette adresse e-mail est déjà vérifiée");
    }

    const code = this.generateOtpCode();
    const tokenHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresInMinutes = this.otpExpiresInMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.updateMany({
        where: {
          userId: user.id,
          email: user.email,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      await tx.verificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          tokenHash,
          expiresAt,
          maxAttempts: this.maxAttempts(),
        },
      });
    });

    await this.email.sendVerificationCode({
      to: user.email,
      firstName: user.firstName,
      code,
      expiresInMinutes,
    });

    return { expiresAt };
  }

  async resendEmailVerificationCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        status: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException("Aucun compte à vérifier n'a été trouvé avec cette adresse e-mail.");
    }

    if (user.emailVerifiedAt || user.status === AccountStatus.ACTIVE) {
      throw new BadRequestException("Cette adresse e-mail est déjà vérifiée");
    }

    const lastToken = await this.prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        email: user.email,
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastToken && Date.now() - lastToken.createdAt.getTime() < this.resendCooldownMs()) {
      throw this.tooManyRequests("Trop de codes demandés. Veuillez patienter avant de demander un nouveau code.");
    }

    return this.sendEmailVerificationCode(user);
  }

  async sendPasswordResetCode(user: {
    id: string;
    email: string;
    firstName: string;
  }) {
    const lastToken = await this.prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        email: user.email,
        purpose: VerificationPurpose.PASSWORD_RESET,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastToken && Date.now() - lastToken.createdAt.getTime() < this.passwordResetCooldownMs()) {
      throw this.tooManyRequests("Trop de codes demandés. Veuillez patienter avant de demander un nouveau code.");
    }

    const code = this.generateOtpCode();
    const tokenHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresInMinutes = this.passwordResetExpiresInMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.updateMany({
        where: {
          userId: user.id,
          email: user.email,
          purpose: VerificationPurpose.PASSWORD_RESET,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      await tx.verificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          purpose: VerificationPurpose.PASSWORD_RESET,
          tokenHash,
          expiresAt,
          maxAttempts: this.passwordResetMaxAttempts(),
        },
      });
    });

    await this.email.sendPasswordResetCode({
      to: user.email,
      firstName: user.firstName,
      code,
      expiresInMinutes,
    });

    return { expiresAt };
  }

  passwordResetFallbackExpiresAt() {
    return new Date(Date.now() + this.passwordResetExpiresInMinutes() * 60 * 1000);
  }

  async verifyEmailCode(email: string, code: string) {
    const token = await this.prisma.verificationToken.findFirst({
      where: {
        email,
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    if (!token || !token.user) {
      throw new BadRequestException("Le code saisi est incorrect.");
    }

    const tokenUser = token.user;

    if (token.expiresAt <= new Date()) {
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException("Ce code a expiré. Demandez un nouveau code pour continuer.");
    }

    if (token.attempts >= token.maxAttempts) {
      throw this.tooManyRequests("Trop de tentatives. Demandez un nouveau code pour continuer.");
    }

    const valid = await argon2.verify(token.tokenHash, code);
    if (!valid) {
      const nextAttempts = token.attempts + 1;
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: {
          attempts: nextAttempts,
          consumedAt: nextAttempts >= token.maxAttempts ? new Date() : null,
        },
      });
      throw new BadRequestException("Le code saisi est incorrect.");
    }

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });

      return tx.user.update({
        where: { id: token.userId ?? tokenUser.id },
        data: {
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: tokenUser.emailVerifiedAt ?? new Date(),
        },
      });
    });

    return user;
  }

  async verifyPasswordResetCode(email: string, code: string) {
    const token = await this.assertPasswordResetCode(email, code);

    await this.prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    return token.user;
  }

  async checkPasswordResetCode(email: string, code: string) {
    await this.assertPasswordResetCode(email, code);
  }

  private async assertPasswordResetCode(email: string, code: string) {
    const token = await this.prisma.verificationToken.findFirst({
      where: {
        email,
        purpose: VerificationPurpose.PASSWORD_RESET,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    if (!token || !token.user || token.user.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException("Le code saisi est incorrect ou n'est plus valide.");
    }

    if (token.expiresAt <= new Date()) {
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException("Ce code a expiré. Demandez un nouveau code pour continuer.");
    }

    if (token.attempts >= token.maxAttempts) {
      throw this.tooManyRequests("Trop de tentatives. Demandez un nouveau code pour continuer.");
    }

    const valid = await argon2.verify(token.tokenHash, code);
    if (!valid) {
      const nextAttempts = token.attempts + 1;
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: {
          attempts: nextAttempts,
          consumedAt: nextAttempts >= token.maxAttempts ? new Date() : null,
        },
      });
      throw new BadRequestException("Le code saisi est incorrect ou n'est plus valide.");
    }

    return { ...token, user: token.user };
  }

  private generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private otpExpiresInMinutes() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_OTP_TTL_MINUTES") ?? "5");
  }

  private maxAttempts() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_MAX_ATTEMPTS") ?? "5");
  }

  private passwordResetExpiresInMinutes() {
    return Number(this.config.get<string>("PASSWORD_RESET_OTP_TTL_MINUTES") ?? "5");
  }

  private passwordResetMaxAttempts() {
    return Number(this.config.get<string>("PASSWORD_RESET_MAX_ATTEMPTS") ?? "5");
  }

  private resendCooldownMs() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS") ?? "60") * 1000;
  }

  private passwordResetCooldownMs() {
    return Number(this.config.get<string>("PASSWORD_RESET_RESEND_COOLDOWN_SECONDS") ?? "60") * 1000;
  }

  private tooManyRequests(message: string) {
    return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
