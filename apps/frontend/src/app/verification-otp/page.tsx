import { Suspense } from "react";
import { VerificationOtpClient } from "@/components/verification-otp-client";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerificationOtpClient />
    </Suspense>
  );
}
