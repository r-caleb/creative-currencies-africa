import { notFound } from "next/navigation";
import { accountTypes, AuthShell } from "@/components/auth-ui";
import { RegistrationWizard } from "@/components/registration-wizard";

const validTypes = accountTypes.map((account) => account.slug);

export function generateStaticParams() {
  return validTypes.map((type) => ({ type }));
}

export default async function RegisterTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const account = accountTypes.find((item) => item.slug === type);

  if (!account) {
    notFound();
  }

  return (
    <AuthShell
      eyebrow={`Inscription ${account.title}`}
      title="Commençons par vos informations essentielles."
      description="Ces éléments permettront de créer votre profil membre et de préparer votre Creative ID."
      aside="minimal"
    >
      <RegistrationWizard account={{ slug: account.slug, title: account.title }} />
    </AuthShell>
  );
}
