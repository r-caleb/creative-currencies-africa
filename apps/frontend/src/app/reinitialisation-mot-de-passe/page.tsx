import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/page-skeletons";
import { ResetPasswordClient } from "@/components/reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton rows={4} aside="minimal" />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
