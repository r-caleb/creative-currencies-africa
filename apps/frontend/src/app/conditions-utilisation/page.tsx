import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Creative Currencies Africa",
  description:
    "Conditions d'utilisation provisoires de la plateforme Creative Currencies Africa.",
};

export default function ConditionsUtilisationPage() {
  return (
    <LegalPage
      eyebrow="Règles d'usage"
      title="Conditions d'utilisation"
      description="Ces conditions définissent les règles de base pour accéder au site, créer un compte, participer à la communauté et utiliser les services proposés par Creative Currencies Africa."
      updatedAt="3 septembre 2026"
      sections={[
        {
          title: "Objet de la plateforme",
          paragraphs: [
            "Creative Currencies Africa est une plateforme institutionnelle, éducative et communautaire destinée à valoriser les industries créatives africaines, accompagner les talents et structurer des parcours professionnels.",
          ],
        },
        {
          title: "Accès au site et aux comptes",
          paragraphs: [
            "Certaines pages sont accessibles librement. L'espace membre, les inscriptions, les ressources, les certificats, les opportunités et certaines interactions nécessitent la création d'un compte.",
            "L'utilisateur s'engage à fournir des informations exactes, à protéger ses accès et à signaler toute utilisation non autorisée de son compte.",
          ],
        },
        {
          title: "Types de comptes",
          paragraphs: [
            "La plateforme peut accueillir plusieurs profils : créateurs, apprenants, organisations, partenaires et administrateurs. Les fonctionnalités disponibles peuvent varier selon le type de compte, le niveau de validation et les droits attribués.",
          ],
        },
        {
          title: "Contenus publiés",
          paragraphs: [
            "Les utilisateurs sont responsables des contenus qu'ils publient : textes, images, vidéos, documents, liens, messages, portfolios et candidatures. Les contenus doivent respecter les droits d'autrui, la loi, la dignité des personnes et l'esprit professionnel de la communauté.",
            "Creative Currencies Africa peut modérer, masquer ou supprimer un contenu qui enfreint ces règles ou nuit à la sécurité de la plateforme.",
          ],
        },
        {
          title: "Formations, événements et opportunités",
          paragraphs: [
            "Les inscriptions aux formations, événements, concours, appels à projets ou missions peuvent être soumises à des conditions spécifiques : disponibilité des places, critères d'éligibilité, validation, paiement, présence ou remise de documents.",
            "Les informations publiées dans les fiches d'activités peuvent évoluer selon les contraintes d'organisation.",
          ],
        },
        {
          title: "Paiements et services payants",
          paragraphs: [
            "Certaines fonctionnalités ou activités pourront devenir payantes : formations, certifications, espaces premium, services partenaires ou événements. Les tarifs, modalités de paiement et conditions de remboursement devront être affichés avant toute transaction.",
          ],
        },
        {
          title: "Suspension et fermeture de compte",
          paragraphs: [
            "En cas de fraude, usage abusif, usurpation, violation des règles communautaires ou atteinte à la sécurité, Creative Currencies Africa pourra limiter, suspendre ou fermer un compte après analyse de la situation.",
          ],
        },
        {
          title: "Évolution du service",
          paragraphs: [
            "La plateforme pourra évoluer progressivement avec de nouvelles fonctionnalités, améliorations, modules communautaires, outils de gestion et services liés aux industries créatives.",
          ],
        },
        {
          title: "Droit applicable",
          paragraphs: [
            "Le droit applicable, la juridiction compétente et les modalités de règlement des litiges seront précisés après validation juridique selon la structure officielle porteuse du projet.",
          ],
        },
      ]}
    />
  );
}
