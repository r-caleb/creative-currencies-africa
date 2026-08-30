import { Suspense } from "react";
import { GroupsPage } from "@/components/groups-page";

export default function Groupes() {
  return (
    <Suspense fallback={null}>
      <GroupsPage />
    </Suspense>
  );
}
