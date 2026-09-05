CREATE TYPE "GalleryAlbumCategory" AS ENUM ('FORMATION', 'EVENT', 'BACKSTAGE', 'ACTIVATION', 'PARTNER', 'VISIT', 'CONFERENCE');

CREATE TABLE "GalleryAlbum" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "category" "GalleryAlbumCategory" NOT NULL DEFAULT 'EVENT',
  "coverImageUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "featuredOnLanding" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GalleryPhoto" (
  "id" TEXT NOT NULL,
  "albumId" TEXT NOT NULL,
  "title" TEXT,
  "caption" TEXT,
  "imageUrl" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GalleryAlbum_slug_key" ON "GalleryAlbum"("slug");
CREATE INDEX "GalleryAlbum_category_idx" ON "GalleryAlbum"("category");
CREATE INDEX "GalleryAlbum_published_idx" ON "GalleryAlbum"("published");
CREATE INDEX "GalleryAlbum_featuredOnLanding_idx" ON "GalleryAlbum"("featuredOnLanding");
CREATE INDEX "GalleryAlbum_sortOrder_idx" ON "GalleryAlbum"("sortOrder");
CREATE INDEX "GalleryAlbum_createdById_idx" ON "GalleryAlbum"("createdById");
CREATE INDEX "GalleryPhoto_albumId_sortOrder_idx" ON "GalleryPhoto"("albumId", "sortOrder");
CREATE INDEX "GalleryPhoto_published_idx" ON "GalleryPhoto"("published");

ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
