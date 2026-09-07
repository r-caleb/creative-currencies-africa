import { NetworkMemberProfilePage } from "@/components/network-member-profile-page";

export default async function NetworkMemberProfileRoute({ params }: { params: Promise<{ memberNumber: string }> }) {
  const { memberNumber } = await params;

  return <NetworkMemberProfilePage memberNumber={memberNumber} />;
}
