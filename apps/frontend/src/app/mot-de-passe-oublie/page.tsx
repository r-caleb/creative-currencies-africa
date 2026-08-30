import { Suspense } from "react";
import { ForgotPasswordClient } from "@/components/forgot-password-client";
import { AuthPageSkeleton } from "@/components/page-skeletons";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton rows={2} aside="minimal" />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
