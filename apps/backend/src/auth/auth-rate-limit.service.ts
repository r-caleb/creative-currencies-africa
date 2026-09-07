import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type AuthRateLimitAction = "register" | "login" | "forgot-password" | "resend-verification" | "verify-email" | "reset-password";

type RateLimitSubject = {
  email?: string;
  ip?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private lastCleanupAt = Date.now();

  constructor(private readonly config: ConfigService) {}

  consume(action: AuthRateLimitAction, subject: RateLimitSubject) {
    this.cleanupExpiredBuckets();

    const ip = this.normalizeKeyPart(subject.ip ?? "unknown");
    const email = subject.email ? this.normalizeKeyPart(subject.email) : null;
    const limits = this.limitsFor(action);

    this.consumeBucket(`${action}:ip:${ip}`, limits.perIp, limits.windowMs);

    if (email) {
      this.consumeBucket(`${action}:email:${email}`, limits.perEmail, limits.windowMs);
    }
  }

  private limitsFor(action: AuthRateLimitAction) {
    const windowMs = this.numberConfig("AUTH_RATE_LIMIT_WINDOW_SECONDS", 15 * 60) * 1000;

    switch (action) {
      case "register":
        return {
          windowMs,
          perIp: this.numberConfig("AUTH_RATE_LIMIT_REGISTER_PER_IP", 5),
          perEmail: this.numberConfig("AUTH_RATE_LIMIT_REGISTER_PER_EMAIL", 3),
        };
      case "login":
        return {
          windowMs,
          perIp: this.numberConfig("AUTH_RATE_LIMIT_LOGIN_PER_IP", 20),
          perEmail: this.numberConfig("AUTH_RATE_LIMIT_LOGIN_PER_EMAIL", 10),
        };
      case "forgot-password":
      case "resend-verification":
        return {
          windowMs,
          perIp: this.numberConfig("AUTH_RATE_LIMIT_OTP_PER_IP", 10),
          perEmail: this.numberConfig("AUTH_RATE_LIMIT_OTP_PER_EMAIL", 5),
        };
      case "verify-email":
      case "reset-password":
        return {
          windowMs,
          perIp: this.numberConfig("AUTH_RATE_LIMIT_VERIFY_PER_IP", 30),
          perEmail: this.numberConfig("AUTH_RATE_LIMIT_VERIFY_PER_EMAIL", 10),
        };
    }
  }

  private consumeBucket(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (bucket.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      throw new HttpException(
        {
          message: "Trop de tentatives. Patientez quelques minutes puis réessayez.",
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
  }

  private cleanupExpiredBuckets() {
    const now = Date.now();

    if (now - this.lastCleanupAt < 60_000) {
      return;
    }

    this.lastCleanupAt = now;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private numberConfig(key: string, fallback: number) {
    const value = Number(this.config.get<string>(key));

    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private normalizeKeyPart(value: string) {
    return value.trim().toLowerCase() || "unknown";
  }
}
