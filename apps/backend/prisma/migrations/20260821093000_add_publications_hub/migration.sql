-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM (
  'PROJECT',
  'CREATION',
  'QUESTION',
  'COLLABORATION',
  'OPPORTUNITY',
  'JOB',
  'RESOURCE',
  'GROUP_DISCUSSION',
  'TRAINING',
  'EVENT',
  'ANNOUNCEMENT'
);

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PublicationAudience" AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC', 'GROUP');

-- CreateEnum
CREATE TYPE "PublicationAttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicationReactionType" AS ENUM ('LIKE', 'SUPPORT', 'SAVE');

-- CreateTable
CREATE TABLE "Publication" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "type" "PublicationType" NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "audience" "PublicationAudience" NOT NULL DEFAULT 'MEMBERS',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "category" TEXT,
  "discipline" TEXT,
  "country" TEXT,
  "city" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "routingDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "linkUrl" TEXT,
  "coverImageUrl" TEXT,
  "groupId" TEXT,
  "opportunityDeadline" TIMESTAMP(3),
  "opportunityLocation" TEXT,
  "budgetRange" TEXT,
  "contactEmail" TEXT,
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAttachment" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "type" "PublicationAttachmentType" NOT NULL DEFAULT 'OTHER',
  "url" TEXT NOT NULL,
  "name" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PublicationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationComment" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PublicationComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationReaction" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PublicationReactionType" NOT NULL DEFAULT 'LIKE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PublicationReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Publication_authorId_idx" ON "Publication"("authorId");

-- CreateIndex
CREATE INDEX "Publication_type_idx" ON "Publication"("type");

-- CreateIndex
CREATE INDEX "Publication_status_idx" ON "Publication"("status");

-- CreateIndex
CREATE INDEX "Publication_audience_idx" ON "Publication"("audience");

-- CreateIndex
CREATE INDEX "Publication_category_idx" ON "Publication"("category");

-- CreateIndex
CREATE INDEX "Publication_publishedAt_idx" ON "Publication"("publishedAt");

-- CreateIndex
CREATE INDEX "Publication_createdAt_idx" ON "Publication"("createdAt");

-- CreateIndex
CREATE INDEX "PublicationAttachment_publicationId_idx" ON "PublicationAttachment"("publicationId");

-- CreateIndex
CREATE INDEX "PublicationAttachment_type_idx" ON "PublicationAttachment"("type");

-- CreateIndex
CREATE INDEX "PublicationComment_publicationId_idx" ON "PublicationComment"("publicationId");

-- CreateIndex
CREATE INDEX "PublicationComment_authorId_idx" ON "PublicationComment"("authorId");

-- CreateIndex
CREATE INDEX "PublicationComment_parentId_idx" ON "PublicationComment"("parentId");

-- CreateIndex
CREATE INDEX "PublicationComment_createdAt_idx" ON "PublicationComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationReaction_publicationId_userId_type_key" ON "PublicationReaction"("publicationId", "userId", "type");

-- CreateIndex
CREATE INDEX "PublicationReaction_publicationId_idx" ON "PublicationReaction"("publicationId");

-- CreateIndex
CREATE INDEX "PublicationReaction_userId_idx" ON "PublicationReaction"("userId");

-- CreateIndex
CREATE INDEX "PublicationReaction_type_idx" ON "PublicationReaction"("type");

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAttachment" ADD CONSTRAINT "PublicationAttachment_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationComment" ADD CONSTRAINT "PublicationComment_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationComment" ADD CONSTRAINT "PublicationComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationComment" ADD CONSTRAINT "PublicationComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PublicationComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationReaction" ADD CONSTRAINT "PublicationReaction_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationReaction" ADD CONSTRAINT "PublicationReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
