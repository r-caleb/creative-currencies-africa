const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  type: string;
  status: string;
  emailVerified: boolean;
};

export type RegistrationPendingResponse = {
  verificationRequired: boolean;
  message: string;
  verificationExpiresAt: string;
  user: AuthUser;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : "Une erreur est survenue. Veuillez réessayer.";
    throw new Error(message);
  }

  return payload as T;
}

export function registerMember(body: Record<string, unknown>) {
  return apiRequest<RegistrationPendingResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyEmail(body: { email: string; code: string }) {
  return apiRequest<AuthResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resendVerification(body: { email: string }) {
  return apiRequest<{ success: boolean; verificationExpiresAt: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
