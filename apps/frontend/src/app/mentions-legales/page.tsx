import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales | Creative Currencies Africa",
  description:
    "Mentions légales provisoires de la plateforme Creative Currencies Africa.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      eyebrow="Cadre légal"
      title="Mentions légales"
      description="Retrouvez les informations essentielles sur l'éditeur du site, l'hébergement, la propriété intellectuelle et les responsabilités liées à l'utilisation de Creative Currencies Africa."
      updatedAt="3 septembre 2026"
      sections={[
        {
          title: "Éditeur du site",
          paragraphs: [
            "Le site Creative Currencies Africa est édité par Creative Currencies Africa, structure dédiée au développement des industries culturelles et créatives africaines.",
            "Adresse du siège social : à compléter. Numéro d'identification légal : à compléter. Adresse e-mail de contact : à compléter.",
          ],
        },
        {
          title: "Responsable de publication",
          paragraphs: [
            "Le responsable de publication est le représentant légal ou la personne désignée par Creative Currencies Africa. Ces informations seront complétées après validation administrative.",
          ],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le site est hébergé par un prestataire technique qui assure la mise en ligne, la disponibilité et la sécurité de l'infrastructure. Nom de l'hébergeur, adresse et contact : à compléter selon la solution retenue.",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "Les textes, visuels, logos, photographies, vidéos, interfaces, éléments graphiques et contenus publiés sur la plateforme sont protégés. Toute reproduction, adaptation ou diffusion non autorisée est interdite.",
            "Les créateurs restent responsables des contenus qu'ils publient dans leur espace membre, notamment leurs portfolios, œuvres, biographies, images et documents associés.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "Creative Currencies Africa met en œuvre des moyens raisonnables pour fournir des informations fiables et maintenir la plateforme accessible. Des erreurs, interruptions ou mises à jour peuvent toutefois survenir.",
            "Les liens externes, réseaux sociaux, partenaires, appels à projets et contenus tiers restent sous la responsabilité de leurs éditeurs respectifs.",
          ],
        },
        {
          title: "Signalement",
          paragraphs: [
            "Pour signaler une erreur, un contenu inapproprié, une atteinte à des droits ou une difficulté d'accès, l'utilisateur peut contacter l'équipe Creative Currencies Africa via l'adresse officielle qui sera communiquée.",
          ],
        },
      ]}
    />
  );
}
