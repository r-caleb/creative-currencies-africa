import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type VerificationCodeEmail = {
  to: string;
  firstName: string;
  code: string;
  expiresInMinutes: number;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationCode(payload: VerificationCodeEmail) {
    const provider = this.config.get<string>("EMAIL_PROVIDER") ?? "console";

    if (provider === "console") {
      this.logger.log(
        [
          "Verification email queued with console provider",
          `to=${payload.to}`,
          `firstName=${payload.firstName}`,
          `code=${payload.code}`,
          `expiresInMinutes=${payload.expiresInMinutes}`,
        ].join(" "),
      );
      return;
    }

    throw new Error(`Unsupported email provider: ${provider}`);
  }
}
