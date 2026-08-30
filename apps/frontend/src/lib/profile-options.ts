export const profileDisciplines = [
  "Mode, couture & stylisme",
  "Beauté, coiffure & esthétique",
  "Artisanat",
  "Arts visuels",
  "Arts plastiques",
  "Illustration & bande dessinée",
  "Photographie",
  "Cinéma & audiovisuel",
  "Musique",
  "Arts de la scène",
  "Danse",
  "Théâtre & conte",
  "Écriture & littérature",
  "Design & graphisme",
  "Design produit & mobilier",
  "Architecture & scénographie",
  "Décoration & aménagement",
  "Patrimoine & culture",
  "Arts numériques",
  "Jeux vidéo & expériences interactives",
  "Arts urbains",
  "Communication & médias",
  "Création de contenu",
  "Radio, podcast & voix",
  "Événementiel & production culturelle",
  "Management artistique & production",
  "Formation & transmission artistique",
  "Gastronomie créative",
  "Autre",
];

export const profileLanguageOptions = [
  "Français",
  "Lingala",
  "Swahili",
  "Kikongo",
  "Tshiluba",
  "Anglais",
  "Portugais",
  "Arabe",
  "Espagnol",
  "Italien",
  "Allemand",
  "Néerlandais",
  "Yoruba",
  "Hausa",
  "Wolof",
  "Bambara",
  "Peul",
  "Fang",
  "Ewe",
  "Twi",
  "Igbo",
  "Luba-Katanga",
  "Mongo",
  "Kituba",
  "Sango",
  "Mashi",
  "Tetela",
  "Ngbaka",
  "Zande",
  "Amharique",
  "Oromo",
  "Kinyarwanda",
  "Kirundi",
  "Luganda",
  "Kiswahili",
  "Malagasy",
  "Somali",
  "Shona",
  "Afrikaans",
  "Zulu",
  "Xhosa",
  "Mandarin",
  "Japonais",
  "Coréen",
  "Hindi",
  "Ourdou",
  "Turc",
  "Russe",
  "Créole",
  "Autre",
];

export function normalizeProfileOption(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function formatCustomLanguage(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, " ");

  if (!normalizedValue) {
    return "";
  }

  return `${normalizedValue[0].toLocaleUpperCase("fr")}${normalizedValue.slice(1)}`;
}
