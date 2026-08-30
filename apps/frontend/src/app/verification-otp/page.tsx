import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/page-skeletons";
import { VerificationOtpClient } from "@/components/verification-otp-client";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton rows={2} aside="minimal" />}>
      <VerificationOtpClient />
    </Suspense>
  );
}
