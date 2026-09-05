import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Creative Currencies Africa",
  description:
    "Politique de confidentialité provisoire de Creative Currencies Africa.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      description="Cette politique explique comment Creative Currencies Africa prévoit de collecter, utiliser, protéger et gérer les données des visiteurs, membres, créateurs, apprenants, organisations et partenaires."
      updatedAt="3 septembre 2026"
      sections={[
        {
          title: "Données collectées",
          paragraphs: [
            "Selon les fonctionnalités utilisées, la plateforme peut collecter les informations d'identification, de contact, de profil, de portfolio, d'inscription aux formations, de participation aux événements, de candidatures aux opportunités et de messagerie.",
          ],
          items: [
            "Nom, prénom, adresse e-mail, téléphone, pays, ville et type de compte.",
            "Creative ID, discipline, biographie, profession, compétences, CV, portfolio, liens web et réseaux sociaux.",
            "Documents, images, vidéos, certificats, inscriptions, participations, messages et notifications.",
            "Données techniques nécessaires à la sécurité, à la connexion, aux préférences et à l'amélioration du service.",
          ],
        },
        {
          title: "Utilisation des données",
          paragraphs: [
            "Les données sont utilisées pour créer et gérer les comptes, personnaliser l'espace membre, faciliter les inscriptions, organiser les formations, suivre les certificats, proposer des opportunités et permettre les échanges communautaires.",
            "Elles peuvent aussi servir à contacter les utilisateurs au sujet de leur compte, des activités Creative Currencies Africa, des newsletters, des événements ou des informations importantes liées à la plateforme.",
          ],
        },
        {
          title: "Partage des informations",
          paragraphs: [
            "Creative Currencies Africa ne vend pas les données personnelles. Certaines informations peuvent être partagées avec des prestataires techniques, partenaires d'événements ou équipes de modération lorsque cela est nécessaire au fonctionnement du service.",
            "Les contenus rendus publics par un membre, comme un portfolio ou une publication, peuvent être visibles par les autres utilisateurs selon les paramètres et règles de visibilité de la plateforme.",
          ],
        },
        {
          title: "Sécurité et conservation",
          paragraphs: [
            "La plateforme prévoit des mesures de sécurité pour protéger les comptes, les fichiers, les messages et les données personnelles. Les durées de conservation seront définies selon les besoins opérationnels, contractuels et légaux.",
          ],
        },
        {
          title: "Droits des utilisateurs",
          paragraphs: [
            "Chaque utilisateur pourra demander l'accès, la correction, la mise à jour, la limitation ou la suppression de ses données, dans les conditions prévues par la réglementation applicable.",
          ],
        },
        {
          id: "cookies",
          title: "Cookies et mesure d'audience",
          paragraphs: [
            "La plateforme peut utiliser des cookies nécessaires au fonctionnement du site, à la sécurité, aux préférences d'affichage et, si cela est activé, à la mesure d'audience. Les outils non essentiels devront être soumis au consentement lorsque la réglementation l'exige.",
          ],
        },
        {
          title: "Contact confidentialité",
          paragraphs: [
            "Toute demande liée à la confidentialité ou aux données personnelles pourra être adressée à Creative Currencies Africa via l'adresse de contact officielle à compléter.",
          ],
        },
      ]}
    />
  );
}
