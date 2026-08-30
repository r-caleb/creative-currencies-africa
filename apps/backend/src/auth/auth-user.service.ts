import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AccountStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveAuthUserOrThrow(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        type: true,
        status: true,
      },
    });

    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("Votre connexion n'est plus valide. Connectez-vous à nouveau.");
    }

    return {
      userId: user.id,
      email: user.email,
      type: user.type,
      status: user.status,
    };
  }
}
