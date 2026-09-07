CREATE TABLE "PublicationMention" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationMention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicationMention_publicationId_userId_key" ON "PublicationMention"("publicationId", "userId");
CREATE INDEX "PublicationMention_publicationId_idx" ON "PublicationMention"("publicationId");
CREATE INDEX "PublicationMention_userId_idx" ON "PublicationMention"("userId");
CREATE INDEX "PublicationMention_createdAt_idx" ON "PublicationMention"("createdAt");

ALTER TABLE "PublicationMention" ADD CONSTRAINT "PublicationMention_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationMention" ADD CONSTRAINT "PublicationMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
