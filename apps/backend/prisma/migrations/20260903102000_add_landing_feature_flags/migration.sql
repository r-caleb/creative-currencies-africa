ALTER TABLE "Training" ADD COLUMN "featuredOnLanding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "featuredOnLanding" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Training_featuredOnLanding_idx" ON "Training"("featuredOnLanding");
CREATE INDEX "Event_featuredOnLanding_idx" ON "Event"("featuredOnLanding");
