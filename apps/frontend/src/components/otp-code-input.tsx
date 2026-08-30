"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef } from "react";

export const OTP_LENGTH = 6;

export function OtpCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusDigit = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();
  };

  const insertDigits = (index: number, nextDigits: string[]) => {
    if (nextDigits.length === 0) {
      return;
    }

    const merged = [...digits];
    nextDigits.forEach((digit, offset) => {
      if (index + offset < OTP_LENGTH) {
        merged[index + offset] = digit;
      }
    });

    onChange(merged.join(""));
    window.setTimeout(() => focusDigit(index + nextDigits.length), 0);
  };

  const clearDigit = (index: number) => {
    const merged = [...digits];
    merged[index] = "";
    onChange(merged.join(""));
  };

  const handleDigitKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      insertDigits(index, [event.key]);
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();

      if (digits[index]) {
        clearDigit(index);
        return;
      }

      if (index > 0) {
        clearDigit(index - 1);
        window.setTimeout(() => focusDigit(index - 1), 0);
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handleDigitPaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index)
      .split("");

    if (pastedDigits.length === 0) {
      return;
    }

    event.preventDefault();
    insertDigits(index, pastedDigits);
  };

  const handleDigitInput = (event: FormEvent<HTMLInputElement>, index: number) => {
    const nextDigits = event.currentTarget.value.replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");

    if (nextDigits.length > 1) {
      insertDigits(index, nextDigits);
    }
  };

  const handleDigitBeforeInput = (event: FormEvent<HTMLInputElement>, index: number) => {
    const inputEvent = event.nativeEvent as InputEvent;
    const nextDigits = (inputEvent.data ?? "").replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");

    if (nextDigits.length > 0) {
      event.preventDefault();
      insertDigits(index, nextDigits);
    }
  };

  return (
    <div className="otp-group" aria-label="Code de vérification">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          aria-label={`Chiffre ${index + 1}`}
          autoComplete="off"
          autoFocus={index === 0}
          disabled={disabled}
          inputMode="numeric"
          value={digit}
          maxLength={1}
          onFocus={(event) => event.target.select()}
          onBeforeInput={(event) => handleDigitBeforeInput(event, index)}
          onChange={(event) => {
            const nextDigits = event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH - index).split("");
            if (nextDigits.length > 0) {
              insertDigits(index, nextDigits);
            } else {
              clearDigit(index);
            }
          }}
          onInput={(event) => handleDigitInput(event, index)}
          onKeyDown={(event) => handleDigitKeyDown(event, index)}
          onPaste={(event) => handleDigitPaste(event, index)}
        />
      ))}
    </div>
  );
}
