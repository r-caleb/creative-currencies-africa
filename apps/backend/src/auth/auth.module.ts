import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { StringValue } from "ms";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthUserService } from "./auth-user.service";
import { JwtStrategy } from "./jwt.strategy";
import { EmailService } from "../email/email.service";
import { VerificationService } from "./verification.service";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: (config.get<string>("JWT_ACCESS_TTL") ?? "15m") as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUserService, AuthRateLimitService, JwtStrategy, VerificationService, EmailService],
  exports: [AuthUserService, JwtModule],
})
export class AuthModule {}
