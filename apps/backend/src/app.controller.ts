import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  health() {
    return {
      status: "ok",
      service: "creative-currencies-api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("platform")
  platform() {
    return {
      name: "Creative Currencies Africa",
      phase: "Phase 2 - backend foundation",
      modules: [
        "auth",
        "reference",
        "member-dashboard",
        "creative-id",
        "portfolio",
        "formations",
        "opportunites",
        "ressources",
        "agenda",
        "certificats",
        "notifications",
        "back-office",
      ],
    };
  }

  @Get("db")
  async database() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: "connected",
      provider: "postgresql",
    };
  }
}
