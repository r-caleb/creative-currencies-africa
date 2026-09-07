"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordVisibilityButton() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function togglePasswordVisibility(event: MouseEvent<HTMLButtonElement>) {
    const input = event.currentTarget.closest(".auth-input-wrap")?.querySelector("input");
    if (!input) {
      return;
    }

    const shouldShowPassword = input.type === "password";
    input.type = shouldShowPassword ? "text" : "password";
    setIsPasswordVisible(shouldShowPassword);
  }

  return (
    <button
      className="auth-input-action"
      type="button"
      aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      aria-pressed={isPasswordVisible}
      onClick={togglePasswordVisibility}
    >
      {isPasswordVisible ? <EyeOff aria-hidden="true" strokeWidth={1.8} /> : <Eye aria-hidden="true" strokeWidth={1.8} />}
    </button>
  );
}
