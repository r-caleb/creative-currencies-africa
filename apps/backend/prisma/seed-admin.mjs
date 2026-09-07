import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AccountStatus, AccountType, PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const connectionString = process.env.DATABASE_URL;
const email = normalizeEmail(process.env.CCA_ADMIN_EMAIL ?? "admin@cca.local");
const password = process.env.CCA_ADMIN_PASSWORD ?? "CcaAdmin2026!";
const firstName = normalizeName(process.env.CCA_ADMIN_FIRST_NAME ?? "Admin");
const lastName = normalizeName(process.env.CCA_ADMIN_LAST_NAME ?? "CCA");

if (!connectionString) {
  throw new Error("DATABASE_URL est requis pour créer l'admin initial.");
}

if (password.length < 8) {
  throw new Error("CCA_ADMIN_PASSWORD doit contenir au moins 8 caractères.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, type: true, status: true },
  });

  const admin = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          firstName,
          lastName,
          passwordHash,
          type: AccountType.ADMIN,
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      })
    : await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          type: AccountType.ADMIN,
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });

  console.log(`Admin CCA prêt: ${admin.email}`);
} finally {
  await prisma.$disconnect();
}

function normalizeEmail(value) {
  const normalized = value.trim().toLowerCase();

  if (!normalized.includes("@")) {
    throw new Error("CCA_ADMIN_EMAIL doit être une adresse e-mail valide.");
  }

  return normalized;
}

function normalizeName(value) {
  return value.trim() || "CCA";
}
