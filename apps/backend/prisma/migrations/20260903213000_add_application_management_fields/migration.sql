-- Add richer dossier fields for opportunity applications and training enrollments.
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

ALTER TABLE "TrainingEnrollment"
  ADD COLUMN "motivation" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "adminNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "OpportunityApplication"
  ADD COLUMN "discipline" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "cvUrl" TEXT,
  ADD COLUMN "fileUrl" TEXT,
  ADD COLUMN "links" JSONB,
  ADD COLUMN "socialLinks" JSONB;
