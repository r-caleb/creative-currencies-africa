import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the PostgreSQL Prisma datasource", async () => {
  const [schema, config] = await Promise.all([
    readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
    readFile(new URL("../prisma.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /provider\s+=\s+"postgresql"/);
  assert.doesNotMatch(schema, /url\s+=\s+env/);
  assert.match(config, /env\("DATABASE_URL"\)/);
});

test("defines core Creative Currencies platform models", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  for (const model of [
    "User",
    "AuthSession",
    "UserIdentity",
    "VerificationToken",
    "CreativeProfile",
    "OrganizationProfile",
    "PartnerProfile",
    "PortfolioItem",
    "Training",
    "TrainingEnrollment",
    "Opportunity",
    "OpportunityApplication",
    "Event",
    "EventRegistration",
    "Resource",
    "Certificate",
    "Partner",
    "Notification",
  ]) {
    assert.match(schema, new RegExp(`model ${model} `));
  }

  assert.match(schema, /enum AuthProvider/);
  assert.match(schema, /GOOGLE/);
  assert.match(schema, /APPLE/);
  assert.match(schema, /FACEBOOK/);
  assert.match(schema, /enum VerificationPurpose/);
  assert.match(schema, /EMAIL_VERIFICATION/);
  assert.match(schema, /PASSWORD_RESET/);
  assert.match(schema, /email\s+String\s+@unique/);
  assert.match(schema, /phone\s+String\?/);
  assert.match(schema, /cvUrl\s+String\?/);
});

test("keeps backend bootstrap aligned with the frontend and API contract", async () => {
  const [
    main,
    appModule,
    controller,
    envExample,
    authController,
    authService,
    verificationService,
    emailService,
    memberController,
    referenceController,
  ] =
    await Promise.all([
    readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.module.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/auth.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/auth.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/verification.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/email/email.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/member/member.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/reference/reference.controller.ts", import.meta.url), "utf8"),
  ]);

  assert.match(main, /setGlobalPrefix\("api"\)/);
  assert.match(main, /SwaggerModule/);
  assert.match(main, /api\/docs/);
  assert.match(main, /addBearerAuth/);
  assert.match(main, /FRONTEND_ORIGINS/);
  assert.match(appModule, /AuthModule/);
  assert.match(appModule, /ReferenceModule/);
  assert.match(appModule, /MemberModule/);
  assert.match(controller, /Phase 2 - backend foundation/);
  assert.match(controller, /member-dashboard/);
  assert.match(controller, /creative-id/);
  assert.match(controller, /back-office/);
  assert.match(authController, /@Controller\("auth"\)/);
  assert.match(authController, /@Post\("register"\)/);
  assert.match(authController, /@Post\("verify-email"\)/);
  assert.match(authController, /@Post\("resend-verification"\)/);
  assert.match(authController, /@Post\("login"\)/);
  assert.match(authController, /@Post\("refresh"\)/);
  assert.match(authController, /@Post\("logout"\)/);
  assert.match(authController, /@Get\("me"\)/);
  assert.match(authService, /argon2\.hash/);
  assert.match(authService, /argon2\.verify/);
  assert.match(authService, /issueTokens/);
  assert.match(authService, /refreshTokenHash/);
  assert.match(authService, /AccountStatus\.PENDING/);
  assert.match(authService, /verifyEmail/);
  assert.match(verificationService, /VerificationPurpose\.EMAIL_VERIFICATION/);
  assert.match(verificationService, /generateOtpCode/);
  assert.match(verificationService, /maxAttempts/);
  assert.match(emailService, /EMAIL_PROVIDER/);
  assert.match(emailService, /console/);
  assert.match(memberController, /@Controller\("member"\)/);
  assert.match(memberController, /@Get\("dashboard"\)/);
  assert.match(memberController, /@Get\("opportunities"\)/);
  assert.match(referenceController, /@Controller\("reference"\)/);
  assert.match(referenceController, /@Get\("disciplines"\)/);
  assert.match(referenceController, /@Get\("onboarding-fields"\)/);
  assert.match(envExample, /creative_currencies/);
  assert.match(envExample, /https:\/\/\*\.vercel\.app/);
  assert.match(envExample, /JWT_ACCESS_SECRET/);
  assert.match(envExample, /JWT_REFRESH_SECRET/);
  assert.match(envExample, /EMAIL_PROVIDER/);
  assert.match(envExample, /EMAIL_VERIFICATION_OTP_TTL_MINUTES/);
});
