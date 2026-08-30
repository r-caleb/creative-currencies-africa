import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, Logger, ValidationError, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const port = resolveBootstrapPort();
  await ensurePortAvailable(port);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = (
    config.get<string>("FRONTEND_ORIGINS") ??
    config.get<string>("FRONTEND_URL") ??
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const wildcardAllowed = allowedOrigins.includes("*");
      const exactAllowed = allowedOrigins.includes(origin);
      const vercelPreviewAllowed =
        allowedOrigins.includes("https://*.vercel.app") &&
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

      callback(null, wildcardAllowed || exactAllowed || vercelPreviewAllowed);
    },
    credentials: true,
  });
  app.useStaticAssets(config.get<string>("UPLOADS_DIR") ?? join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => new BadRequestException(validationMessages(errors)),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Creative Currencies Africa API")
    .setDescription("API NestJS pour le site, l'authentification et l'espace membre Creative Currencies Africa.")
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token retourné par /api/auth/login ou /api/auth/verify-email.",
      },
      "access-token",
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(config.get<number>("PORT") ?? port);
}

void bootstrap().catch((error: NodeJS.ErrnoException) => {
  const logger = new Logger("Bootstrap");

  if (error.code === "EADDRINUSE") {
    const port = resolveBootstrapPort();
    logger.error(
      `Le backend CCA utilise déjà le port ${port}. Gardez l'instance existante ou arrêtez-la avant de relancer le serveur.`,
    );
    process.exit(1);
  }

  if (error.code === "EPERM") {
    const port = resolveBootstrapPort();
    logger.error(`Le backend CCA ne peut pas ouvrir le port ${port}. Vérifiez les permissions du terminal ou lancez-le hors sandbox.`);
    process.exit(1);
  }

  throw error;
});

function resolveBootstrapPort() {
  const envPort = Number(process.env.PORT);

  if (Number.isFinite(envPort) && envPort > 0) {
    return envPort;
  }

  const dotenvPort = readDotenvPort();
  return dotenvPort ?? 4000;
}

function readDotenvPort() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return null;
  }

  const match = readFileSync(envPath, "utf8").match(/^PORT="?(\d+)"?$/m);
  const port = match ? Number(match[1]) : Number.NaN;

  return Number.isFinite(port) && port > 0 ? port : null;
}

function ensurePortAvailable(port: number) {
  return new Promise<void>((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.once("listening", () => {
      server.close(() => resolve());
    });
    server.listen(port);
  });
}

function validationMessages(errors: ValidationError[]): string[] {
  const messages = flattenValidationErrors(errors);

  return messages.length > 0 ? messages : ["Vérifiez les informations saisies, puis réessayez."];
}

function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const ownMessages = Object.entries(error.constraints ?? {}).map(([key, message]) =>
      key === "whitelistValidation" ? "Une information du formulaire n'est pas reconnue. Rechargez la page puis réessayez." : message,
    );

    return [...ownMessages, ...flattenValidationErrors(error.children ?? [])];
  });
}
