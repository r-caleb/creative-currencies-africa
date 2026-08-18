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
      throw new BadRequestException("Aucun compte en attente ne correspond à cette adresse e-mail");
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
      throw this.tooManyRequests("Veuillez patienter avant de demander un nouveau code");
    }

    return this.sendEmailVerificationCode(user);
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
      throw new BadRequestException("Code de vérification invalide");
    }

    const tokenUser = token.user;

    if (token.expiresAt <= new Date()) {
      await this.prisma.verificationToken.update({
        where: { id: token.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException("Code de vérification expiré");
    }

    if (token.attempts >= token.maxAttempts) {
      throw this.tooManyRequests("Nombre maximal de tentatives atteint");
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
      throw new BadRequestException("Code de vérification invalide");
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

  private generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private otpExpiresInMinutes() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_OTP_TTL_MINUTES") ?? "15");
  }

  private maxAttempts() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_MAX_ATTEMPTS") ?? "5");
  }

  private resendCooldownMs() {
    return Number(this.config.get<string>("EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS") ?? "60") * 1000;
  }

  private tooManyRequests(message: string) {
    return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
