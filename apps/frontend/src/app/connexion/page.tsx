import { Suspense } from "react";
import { LoginClient } from "@/components/login-client";
import { AuthPageSkeleton } from "@/components/page-skeletons";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton rows={3} aside="portrait" />}>
      <LoginClient />
    </Suspense>
  );
}
