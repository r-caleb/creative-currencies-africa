import { Injectable } from "@nestjs/common";

@Injectable()
export class ReferenceService {
  getAccountTypes() {
    return [
      {
        value: "CREATOR",
        label: "Créateur",
        description: "Artistes, designers, photographes, stylistes, musiciens et talents créatifs.",
      },
      {
        value: "LEARNER",
        label: "Apprenant",
        description: "Étudiants et jeunes talents qui veulent apprendre, progresser et se former.",
      },
      {
        value: "ORGANIZATION",
        label: "Organisation",
        description: "Écoles, collectifs, studios, associations et structures culturelles.",
      },
      {
        value: "PARTNER",
        label: "Partenaire",
        description: "Sponsors, institutions, marques, médias et partenaires de développement.",
      },
    ];
  }

  getDisciplines() {
    return [
      "Mode",
      "Photographie",
      "Stylisme",
      "Cinéma et vidéo",
      "Musique",
      "Arts visuels",
      "Design graphique",
      "Architecture",
      "Littérature",
      "Danse",
      "Théâtre",
      "Artisanat",
      "Autre",
    ];
  }

  getOnboardingFields() {
    return {
      common: [
        "Prénom",
        "Nom",
        "Adresse e-mail",
        "Téléphone",
        "Pays",
        "Ville",
        "Photo de profil",
        "Date de naissance",
        "Genre",
      ],
      creator: [
        "Profession",
        "Discipline principale",
        "Discipline autre",
        "Biographie",
        "Compétences",
        "Portfolio",
        "Réseaux sociaux",
        "Disponibilité",
      ],
      learner: [
        "Profession ou niveau d'étude",
        "Discipline d'intérêt",
        "Objectif d'apprentissage",
        "Compétences à développer",
      ],
      organization: [
        "Nom de l'organisation",
        "Secteur",
        "Description",
        "Site web",
        "Personne de contact",
      ],
      partner: ["Nom du partenaire", "Type de partenaire", "Objectifs", "Site web", "Personne de contact"],
    };
  }
}
