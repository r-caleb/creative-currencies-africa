import { Suspense } from "react";
import { MessagesPage } from "@/components/messages-page";

export default function Messages() {
  return (
    <Suspense fallback={null}>
      <MessagesPage />
    </Suspense>
  );
}
