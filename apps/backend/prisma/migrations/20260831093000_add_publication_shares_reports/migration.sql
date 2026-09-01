CREATE TYPE "PublicationReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'HARASSMENT', 'OTHER');

CREATE TYPE "PublicationReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

CREATE TABLE "PublicationShare" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicationReport" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "PublicationReportReason" NOT NULL,
    "message" TEXT,
    "status" "PublicationReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicationShare_publicationId_userId_key" ON "PublicationShare"("publicationId", "userId");
CREATE INDEX "PublicationShare_publicationId_idx" ON "PublicationShare"("publicationId");
CREATE INDEX "PublicationShare_userId_idx" ON "PublicationShare"("userId");
CREATE INDEX "PublicationShare_createdAt_idx" ON "PublicationShare"("createdAt");

CREATE UNIQUE INDEX "PublicationReport_publicationId_reporterId_key" ON "PublicationReport"("publicationId", "reporterId");
CREATE INDEX "PublicationReport_publicationId_idx" ON "PublicationReport"("publicationId");
CREATE INDEX "PublicationReport_reporterId_idx" ON "PublicationReport"("reporterId");
CREATE INDEX "PublicationReport_reason_idx" ON "PublicationReport"("reason");
CREATE INDEX "PublicationReport_status_idx" ON "PublicationReport"("status");
CREATE INDEX "PublicationReport_createdAt_idx" ON "PublicationReport"("createdAt");

ALTER TABLE "PublicationShare" ADD CONSTRAINT "PublicationShare_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationShare" ADD CONSTRAINT "PublicationShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationReport" ADD CONSTRAINT "PublicationReport_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationReport" ADD CONSTRAINT "PublicationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
