import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
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

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
}

void bootstrap();
