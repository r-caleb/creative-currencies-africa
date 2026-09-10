ALTER TABLE "Training" ADD COLUMN "showInFeed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Training" ADD COLUMN "publicationId" TEXT;

ALTER TABLE "Event" ADD COLUMN "showInFeed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "publicationId" TEXT;

ALTER TABLE "Resource" ADD COLUMN "showInFeed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resource" ADD COLUMN "publicationId" TEXT;

ALTER TABLE "Opportunity" ADD COLUMN "coverImageUrl" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "showInFeed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Opportunity" ADD COLUMN "publicationId" TEXT;

CREATE UNIQUE INDEX "Training_publicationId_key" ON "Training"("publicationId");
CREATE INDEX "Training_showInFeed_idx" ON "Training"("showInFeed");
CREATE INDEX "Training_publicationId_idx" ON "Training"("publicationId");

CREATE UNIQUE INDEX "Event_publicationId_key" ON "Event"("publicationId");
CREATE INDEX "Event_showInFeed_idx" ON "Event"("showInFeed");
CREATE INDEX "Event_publicationId_idx" ON "Event"("publicationId");

CREATE UNIQUE INDEX "Resource_publicationId_key" ON "Resource"("publicationId");
CREATE INDEX "Resource_showInFeed_idx" ON "Resource"("showInFeed");
CREATE INDEX "Resource_publicationId_idx" ON "Resource"("publicationId");

CREATE UNIQUE INDEX "Opportunity_publicationId_key" ON "Opportunity"("publicationId");
CREATE INDEX "Opportunity_showInFeed_idx" ON "Opportunity"("showInFeed");
CREATE INDEX "Opportunity_publicationId_idx" ON "Opportunity"("publicationId");

ALTER TABLE "Training"
ADD CONSTRAINT "Training_publicationId_fkey"
FOREIGN KEY ("publicationId") REFERENCES "Publication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_publicationId_fkey"
FOREIGN KEY ("publicationId") REFERENCES "Publication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Resource"
ADD CONSTRAINT "Resource_publicationId_fkey"
FOREIGN KEY ("publicationId") REFERENCES "Publication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_publicationId_fkey"
FOREIGN KEY ("publicationId") REFERENCES "Publication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
