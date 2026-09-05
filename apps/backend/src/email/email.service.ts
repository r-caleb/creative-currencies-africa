import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sgMail, { type MailDataRequired } from "@sendgrid/mail";

type VerificationCodeEmail = {
  to: string;
  firstName: string;
  code: string;
  expiresInMinutes: number;
};

type PasswordResetCodeEmail = VerificationCodeEmail;
type EmailPurpose = "verification" | "password-reset";
type EmailProvider = "console" | "sendgrid";

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

    if (provider === "sendgrid") {
      return this.sendSendGridCode(purpose, payload);
    }

    throw new BadGatewayException(`Provider email non supporté: ${provider}`);
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

  private async sendSendGridCode(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    const apiKey = this.requiredConfig("SENDGRID_API_KEY");
    const fromEmail = this.requiredConfig("SENDGRID_FROM_EMAIL");
    const fromName = this.config.get<string>("SENDGRID_FROM_NAME")?.trim() || "Creative Currencies Africa";
    const templateId = this.templateIdForPurpose(purpose);

    sgMail.setApiKey(apiKey);

    const message = templateId
      ? this.sendGridTemplateMessage(purpose, payload, fromEmail, fromName, templateId)
      : this.sendGridPlainMessage(purpose, payload, fromEmail, fromName);

    try {
      await sgMail.send(message);
      this.logger.log(`Code ${purpose} envoyé par SendGrid à ${payload.to}`);
    } catch (error) {
      this.logger.error(`Erreur SendGrid ${purpose}: ${this.formatSendGridError(error)}`);
      throw new BadGatewayException("Impossible d'envoyer le code par e-mail pour le moment.");
    }
  }

  private sendGridTemplateMessage(
    purpose: EmailPurpose,
    payload: VerificationCodeEmail,
    fromEmail: string,
    fromName: string,
    templateId: string,
  ): MailDataRequired {
    return {
      to: this.normalizeEmail(payload.to),
      from: { email: fromEmail, name: fromName },
      templateId,
      dynamicTemplateData: this.dynamicTemplateData(purpose, payload),
    };
  }

  private sendGridPlainMessage(
    purpose: EmailPurpose,
    payload: VerificationCodeEmail,
    fromEmail: string,
    fromName: string,
  ): MailDataRequired {
    const subject = purpose === "verification" ? "Votre code de vérification Creative Currencies Africa" : "Réinitialisation de votre mot de passe";
    const action = purpose === "verification" ? "vérifier votre adresse e-mail" : "réinitialiser votre mot de passe";
    const firstName = this.escapeHtml(payload.firstName || "membre");
    const code = this.escapeHtml(payload.code);
    const expires = this.escapeHtml(String(payload.expiresInMinutes));

    return {
      to: this.normalizeEmail(payload.to),
      from: { email: fromEmail, name: fromName },
      subject,
      text: [
        `Bonjour ${payload.firstName || "membre"},`,
        "",
        `Votre code pour ${action} est : ${payload.code}`,
        `Il est valable ${payload.expiresInMinutes} minutes.`,
        "",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
        "Creative Currencies Africa",
      ].join("\n"),
      html: [
        `<p>Bonjour ${firstName},</p>`,
        `<p>Votre code pour ${this.escapeHtml(action)} est :</p>`,
        `<p style="font-size:28px;letter-spacing:6px;font-weight:700;">${code}</p>`,
        `<p>Il est valable ${expires} minutes.</p>`,
        "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>",
        "<p>Creative Currencies Africa</p>",
      ].join(""),
    };
  }

  private dynamicTemplateData(purpose: EmailPurpose, payload: VerificationCodeEmail) {
    return {
      firstName: payload.firstName,
      code: payload.code,
      expiry_minutes: String(payload.expiresInMinutes),
      expiresInMinutes: payload.expiresInMinutes,
      projectName: "Creative Currencies Africa",
      purpose: purpose === "verification" ? "verification" : "password_reset",
      year: new Date().getFullYear().toString(),
    };
  }

  private templateIdForPurpose(purpose: EmailPurpose) {
    if (purpose === "verification") {
      return (
        this.config.get<string>("SENDGRID_TEMPLATE_ID_EMAIL_VERIFICATION")?.trim()
        || this.config.get<string>("SENDGRID_TEMPLATE_ID_OTP")?.trim()
        || ""
      );
    }

    return this.config.get<string>("SENDGRID_TEMPLATE_ID_RESET_PASSWORD")?.trim() || "";
  }

  private emailProvider(): EmailProvider {
    const configuredProvider = this.config.get<string>("EMAIL_PROVIDER")?.trim().toLowerCase();
    if (configuredProvider) {
      return configuredProvider as EmailProvider;
    }

    return this.config.get<string>("SENDGRID_API_KEY") ? "sendgrid" : "console";
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      throw new BadGatewayException(`${key} est requis pour l'envoi des e-mails.`);
    }
    return value;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private escapeHtml(value: string) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  private formatSendGridError(error: unknown) {
    if (typeof error !== "object" || error === null) {
      return String(error);
    }

    const maybeSendGridError = error as { response?: { body?: { errors?: Array<{ message?: string }> } }; message?: string };
    const messages = maybeSendGridError.response?.body?.errors?.map((item) => item.message).filter(Boolean);
    return messages?.length ? messages.join(", ") : maybeSendGridError.message ?? String(error);
  }
}
