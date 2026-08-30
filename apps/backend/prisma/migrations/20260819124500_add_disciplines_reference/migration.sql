-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_name_key" ON "Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_slug_key" ON "Discipline"("slug");

-- CreateIndex
CREATE INDEX "Discipline_isActive_sortOrder_idx" ON "Discipline"("isActive", "sortOrder");

-- SeedData
INSERT INTO "Discipline" ("id", "name", "slug", "sortOrder") VALUES
('discipline_mode_couture_stylisme', 'Mode, couture & stylisme', 'mode-couture-stylisme', 10),
('discipline_beaute_coiffure_esthetique', 'Beauté, coiffure & esthétique', 'beaute-coiffure-esthetique', 20),
('discipline_artisanat', 'Artisanat', 'artisanat', 30),
('discipline_arts_visuels', 'Arts visuels', 'arts-visuels', 40),
('discipline_arts_plastiques', 'Arts plastiques', 'arts-plastiques', 50),
('discipline_illustration_bande_dessinee', 'Illustration & bande dessinée', 'illustration-bande-dessinee', 60),
('discipline_photographie', 'Photographie', 'photographie', 70),
('discipline_cinema_audiovisuel', 'Cinéma & audiovisuel', 'cinema-audiovisuel', 80),
('discipline_musique', 'Musique', 'musique', 90),
('discipline_arts_de_la_scene', 'Arts de la scène', 'arts-de-la-scene', 100),
('discipline_danse', 'Danse', 'danse', 110),
('discipline_theatre_conte', 'Théâtre & conte', 'theatre-conte', 120),
('discipline_ecriture_litterature', 'Écriture & littérature', 'ecriture-litterature', 130),
('discipline_design_graphisme', 'Design & graphisme', 'design-graphisme', 140),
('discipline_design_produit_mobilier', 'Design produit & mobilier', 'design-produit-mobilier', 150),
('discipline_architecture_scenographie', 'Architecture & scénographie', 'architecture-scenographie', 160),
('discipline_decoration_amenagement', 'Décoration & aménagement', 'decoration-amenagement', 170),
('discipline_patrimoine_culture', 'Patrimoine & culture', 'patrimoine-culture', 180),
('discipline_arts_numeriques', 'Arts numériques', 'arts-numeriques', 190),
('discipline_jeux_video_experiences_interactives', 'Jeux vidéo & expériences interactives', 'jeux-video-experiences-interactives', 200),
('discipline_arts_urbains', 'Arts urbains', 'arts-urbains', 210),
('discipline_communication_medias', 'Communication & médias', 'communication-medias', 220),
('discipline_creation_de_contenu', 'Création de contenu', 'creation-de-contenu', 230),
('discipline_radio_podcast_voix', 'Radio, podcast & voix', 'radio-podcast-voix', 240),
('discipline_evenementiel_production_culturelle', 'Événementiel & production culturelle', 'evenementiel-production-culturelle', 250),
('discipline_management_artistique_production', 'Management artistique & production', 'management-artistique-production', 260),
('discipline_formation_transmission_artistique', 'Formation & transmission artistique', 'formation-transmission-artistique', 270),
('discipline_gastronomie_creative', 'Gastronomie créative', 'gastronomie-creative', 280),
('discipline_autre', 'Autre', 'autre', 1000)
ON CONFLICT ("slug") DO NOTHING;
