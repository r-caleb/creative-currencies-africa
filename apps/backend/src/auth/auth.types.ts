import type { AccountStatus, AccountType } from "@prisma/client";

export type AuthUser = {
  userId: string;
  email: string;
  type: AccountType;
  status: AccountStatus;
};

export type TokenMeta = {
  deviceId?: string;
  userAgent?: string;
  ip?: string;
};
