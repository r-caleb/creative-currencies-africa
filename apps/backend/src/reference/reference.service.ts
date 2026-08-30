import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { AccountType, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDisciplineDto } from "./dto/create-discipline.dto";
import { UpdateDisciplineDto } from "./dto/update-discipline.dto";

const defaultDisciplines = [
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

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  getAccountTypes() {
    return [
      {
        value: "PUBLIC",
        label: "Public",
        description: "Membres qui souhaitent découvrir la plateforme, suivre l'actualité et interagir librement.",
      },
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
        description: "Écoles, studios, médias, collectifs, institutions, structures créatives et partenaires.",
      },
    ];
  }

  async getDisciplines() {
    try {
      await this.ensureDefaultDisciplines();

      const disciplines = await this.prisma.discipline.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { name: true },
      });

      return disciplines.length > 0 ? disciplines.map((discipline) => discipline.name) : defaultDisciplines;
    } catch {
      return defaultDisciplines;
    }
  }

  async createDiscipline(authUser: AuthUser, input: CreateDisciplineDto) {
    this.ensureAdmin(authUser);

    const name = this.requiredText(input.name, "Le nom de la discipline est requis.");
    const slug = input.slug?.trim() ? this.slugify(input.slug) : await this.buildUniqueSlug(name);

    try {
      return await this.prisma.discipline.create({
        data: {
          name,
          slug,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException("Cette discipline existe déjà.");
      }

      throw error;
    }
  }

  async updateDiscipline(authUser: AuthUser, id: string, input: UpdateDisciplineDto) {
    this.ensureAdmin(authUser);

    if (!Object.keys(input).length) {
      throw new BadRequestException("Aucune information à mettre à jour.");
    }

    const data: Prisma.DisciplineUpdateInput = {};

    if (input.name !== undefined) {
      data.name = this.requiredText(input.name, "Le nom de la discipline est requis.");
    }

    if (input.slug !== undefined) {
      data.slug = this.slugify(input.slug);
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    try {
      return await this.prisma.discipline.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        throw new ConflictException("Cette discipline existe déjà.");
      }

      throw error;
    }
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

  private async ensureDefaultDisciplines() {
    const count = await this.prisma.discipline.count();

    if (count > 0) {
      return;
    }

    await this.prisma.discipline.createMany({
      data: defaultDisciplines.map((name, index) => ({
        name,
        slug: this.slugify(name),
        sortOrder: name === "Autre" ? 1000 : (index + 1) * 10,
      })),
      skipDuplicates: true,
    });
  }

  private ensureAdmin(authUser: AuthUser) {
    if (authUser.type !== AccountType.ADMIN) {
      throw new ForbiddenException("Seul un administrateur peut gérer les disciplines.");
    }
  }

  private requiredText(value: unknown, message: string) {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " et ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      throw new BadRequestException("Le slug de la discipline est invalide.");
    }

    return slug;
  }

  private async buildUniqueSlug(name: string) {
    const baseSlug = this.slugify(name);
    const existingDisciplines = await this.prisma.discipline.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existingDisciplines.map((discipline) => discipline.slug));

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    let candidate = `${baseSlug}-${suffix}`;

    while (existingSlugs.has(candidate)) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private isUniqueConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
