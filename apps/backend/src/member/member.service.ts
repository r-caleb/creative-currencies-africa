import { Injectable } from "@nestjs/common";

const sampleMember = {
  id: "demo-member",
  fullName: "Nathan LEKA",
  handle: "@nathleka",
  type: "CREATOR",
  discipline: "Direction artistique",
  memberNumber: "CCA-2026-0142",
  profileCompletion: 68,
};

@Injectable()
export class MemberService {
  getDashboard() {
    return {
      member: sampleMember,
      priorities: [
        {
          title: "Compléter le Creative ID",
          description: "Ajoutez votre biographie, vos compétences, votre portfolio et vos réseaux.",
          href: "/espace-membre/creative-id",
        },
        {
          title: "Explorer les formations",
          description: "Découvrez les workshops, masterclass et parcours disponibles selon votre discipline.",
          href: "/espace-membre/formations",
        },
        {
          title: "Préparer une candidature",
          description: "Repérez les concours, résidences, missions et financements adaptés à votre profil.",
          href: "/espace-membre/opportunites",
        },
      ],
      stats: {
        certificates: 4,
        opportunities: 12,
        networkContacts: 248,
        resources: 18,
      },
    };
  }

  getCreativeId() {
    return {
      member: sampleMember,
      profile: {
        country: "République démocratique du Congo",
        city: "Kinshasa",
        profession: "Directeur artistique",
        bio: "Créatif congolais spécialisé dans l'identité visuelle, la direction artistique et les projets culturels.",
        skills: ["Identité visuelle", "Direction artistique", "Photographie", "Branding"],
        visibility: "MEMBERS",
      },
      portfolio: [
        {
          title: "Identité visuelle culturelle",
          category: "Design graphique",
          year: 2026,
        },
        {
          title: "Série photographique backstage",
          category: "Photographie",
          year: 2026,
        },
      ],
    };
  }

  getTrainings() {
    return [
      {
        title: "Business of Fashion",
        status: "PUBLISHED",
        startsAt: "2026-09-02",
        location: "Silikin Village",
        progress: 60,
      },
      {
        title: "Photographie et storytelling visuel",
        status: "PUBLISHED",
        startsAt: "2026-09-03",
        location: "Silikin Village",
        progress: 0,
      },
    ];
  }

  getOpportunities() {
    return [
      {
        title: "Africa Design Fund",
        type: "FUNDING",
        deadline: "2026-06-15",
        location: "Afrique francophone",
        recommended: true,
      },
      {
        title: "Résidence artistique - Kinshasa",
        type: "RESIDENCY",
        deadline: "2026-06-30",
        location: "Kinshasa",
        recommended: true,
      },
      {
        title: "Mission designer freelance",
        type: "MISSION",
        deadline: null,
        location: "Hybride",
        recommended: false,
      },
    ];
  }

  getResources() {
    return [
      {
        title: "Syllabus - Business of Fashion",
        type: "PDF",
        accessLevel: "ENROLLED",
      },
      {
        title: "Template portfolio créatif",
        type: "TEMPLATE",
        accessLevel: "MEMBERS",
      },
      {
        title: "Guide de préparation aux appels à projets",
        type: "GUIDE",
        accessLevel: "MEMBERS",
      },
    ];
  }

  getAgenda() {
    return [
      {
        title: "Journée de formation",
        type: "WORKSHOP",
        startsAt: "2026-09-02T09:00:00.000Z",
        location: "Silikin Village",
      },
      {
        title: "Panel talk: The Business of Fashion",
        type: "PANEL",
        startsAt: "2026-09-05T15:00:00.000Z",
        location: "Silikin Village",
      },
    ];
  }

  getCertificates() {
    return [
      {
        title: "Marketing digital pour artistes",
        number: "CCA-CERT-2026-0031",
        status: "ISSUED",
        issuedAt: "2026-05-20",
      },
      {
        title: "Business of Fashion",
        number: "CCA-CERT-2026-0142",
        status: "PENDING",
        issuedAt: null,
      },
    ];
  }
}
