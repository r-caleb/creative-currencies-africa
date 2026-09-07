import type { AuthUser, MemberProfile, OrganizationProfile, PartnerProfile } from "@/lib/api";

export function accountTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    PUBLIC: "Public",
    CREATOR: "Créateur",
    LEARNER: "Apprenant",
    ORGANIZATION: "Organisation",
    PARTNER: "Partenaire",
    ADMIN: "CCA",
  };

  return type ? labels[type] ?? "Membre" : "Membre";
}

export function getMemberDisplayName({
  user,
  profile,
  organizationProfile,
  partnerProfile,
}: {
  user: AuthUser | null;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
}) {
  return (
    cleanDisplayValue(organizationProfile?.name) ??
    cleanDisplayValue(partnerProfile?.name) ??
    cleanDisplayValue(profile?.publicName) ??
    cleanDisplayValue(user?.fullName) ??
    "Membre CCA"
  );
}

export function getMemberProfileTitle({
  user,
  profile,
  organizationProfile,
  partnerProfile,
}: {
  user: AuthUser | null;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
}) {
  return profile?.discipline ?? organizationProfile?.sector ?? partnerProfile?.partnerType ?? accountTypeLabel(user?.type);
}

export function buildInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CC";
}

function cleanDisplayValue(value?: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue || null;
}
