import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type VerificationCodeEmail = {
  to: string;
  firstName: string;
  code: string;
  expiresInMinutes: number;
};

type PasswordResetCodeEmail = VerificationCodeEmail;
type EmailPurpose = "verification" | "password-reset";
type EmailProvider = "console" | "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationCode(payload: VerificationCodeEmail) {
    return this.sendCode("verification", payload);
  }

  async sendPasswordResetCode(payload: PasswordResetCodeEmail) {
    return this.sendCode("password-reset", payload);
  }

  private async sendCode(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const provider = this.emailProvider();

    if (provider === "console") {
      return this.sendConsoleCode(purpose, payload);
    }

    if (provider === "resend") {
      return this.sendResendCode(purpose, payload);
    }

    throw new Error(`Unsupported email provider: ${provider}`);
  }

  private async sendConsoleCode(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const label = purpose === "verification" ? "Verification email queued with console provider" : "Password reset email queued with console provider";

    this.logger.log(
      [
        label,
        `to=${payload.to}`,
        `firstName=${payload.firstName}`,
        `code=${payload.code}`,
        `expiresInMinutes=${payload.expiresInMinutes}`,
      ].join(" "),
    );
  }

  private async sendResendCode(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const apiKey = this.requiredConfig("RESEND_API_KEY");
    const from = this.requiredConfig("EMAIL_FROM");
    const apiUrl = this.config.get<string>("RESEND_API_URL")?.trim() || "https://api.resend.com/emails";
    const replyTo = this.config.get<string>("EMAIL_REPLY_TO")?.trim();
    const recipient = this.emailRecipient(payload.to);
    const subject =
      purpose === "verification"
        ? "Votre code de vérification Creative Currencies Africa"
        : "Votre code de réinitialisation Creative Currencies Africa";
    const text = this.codeEmailText(purpose, payload);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        text,
        html: this.codeEmailHtml(purpose, payload),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      this.logger.error(`Erreur Resend ${purpose}: status=${response.status} ${details.slice(0, 400)}`);
      throw new Error("Impossible d'envoyer l'e-mail pour le moment.");
    }

    this.logger.log(`Resend email sent purpose=${purpose} to=${recipient}${recipient !== payload.to ? ` originalTo=${payload.to}` : ""}`);
  }

  private codeEmailText(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const intro =
      purpose === "verification"
        ? "Voici votre code de vérification Creative Currencies Africa."
        : "Voici votre code pour réinitialiser votre mot de passe Creative Currencies Africa.";

    return [
      `Bonjour ${payload.firstName},`,
      "",
      intro,
      "",
      `Code : ${payload.code}`,
      `Ce code expire dans ${payload.expiresInMinutes} minutes.`,
      "",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      "",
      "Creative Currencies Africa",
    ].join("\n");
  }

  private codeEmailHtml(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const intro =
      purpose === "verification"
        ? "Voici votre code de vérification Creative Currencies Africa."
        : "Voici votre code pour réinitialiser votre mot de passe Creative Currencies Africa.";
    const logoUrl = this.config.get<string>("EMAIL_LOGO_URL")?.trim();
    const header = logoUrl
      ? `<img src="${this.escapeHtml(logoUrl)}" alt="Creative Currencies Africa" width="180" style="display:block;max-width:180px;height:auto;margin:0 auto 18px;" />`
      : `<p style="margin:0 0 18px;text-align:center;font-size:18px;font-weight:700;color:#b7791f;">Creative Currencies Africa</p>`;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        ${header}
        <p>Bonjour ${this.escapeHtml(payload.firstName)},</p>
        <p>${intro}</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 18px 22px; border-radius: 12px; background: #fff7df; color: #b7791f; text-align: center;">
          ${this.escapeHtml(payload.code)}
        </div>
        <p>Ce code expire dans <strong>${payload.expiresInMinutes} minutes</strong>.</p>
        <p style="color: #6b7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <p>Creative Currencies Africa</p>
      </div>
    `;
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`Missing email configuration: ${key}`);
    }

    return value;
  }

  private emailProvider(): EmailProvider {
    const provider = this.config.get<string>("EMAIL_PROVIDER")?.trim().toLowerCase() || "console";

    if (provider === "resend") {
      return "resend";
    }

    return "console";
  }

  private emailRecipient(to: string) {
    return this.config.get<string>("EMAIL_DEV_REDIRECT_TO")?.trim() || to;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
