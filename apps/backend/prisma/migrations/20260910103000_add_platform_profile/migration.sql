ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

CREATE TABLE "PlatformProfile" (
  "id" TEXT NOT NULL DEFAULT 'official-cca',
  "displayName" TEXT NOT NULL DEFAULT 'Creative Currencies Africa',
  "logoUrl" TEXT NOT NULL DEFAULT '/assets/cca-mask-gold-transparent.png',
  "publicEmail" TEXT,
  "phone" TEXT,
  "whatsappUrl" TEXT,
  "websiteUrl" TEXT,
  "facebookUrl" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "youtubeUrl" TEXT,
  "shortBio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlatformProfile_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformProfile" (
  "id",
  "displayName",
  "logoUrl",
  "publicEmail",
  "phone",
  "whatsappUrl",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
  "linkedinUrl",
  "youtubeUrl",
  "shortBio",
  "updatedAt"
) VALUES (
  'official-cca',
  'Creative Currencies Africa',
  '/assets/cca-mask-gold-transparent.png',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Plateforme communautaire dédiée aux industries culturelles et créatives africaines.',
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;
