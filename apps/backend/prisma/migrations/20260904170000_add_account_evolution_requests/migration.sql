-- CreateEnum
CREATE TYPE "AccountEvolutionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AccountEvolutionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromType" "AccountType" NOT NULL,
    "requestedType" "AccountType" NOT NULL,
    "status" "AccountEvolutionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT,
    "portfolioUrl" TEXT,
    "cvUrl" TEXT,
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountEvolutionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountEvolutionRequest_userId_idx" ON "AccountEvolutionRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountEvolutionRequest_status_idx" ON "AccountEvolutionRequest"("status");

-- CreateIndex
CREATE INDEX "AccountEvolutionRequest_requestedType_idx" ON "AccountEvolutionRequest"("requestedType");

-- CreateIndex
CREATE INDEX "AccountEvolutionRequest_createdAt_idx" ON "AccountEvolutionRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "AccountEvolutionRequest" ADD CONSTRAINT "AccountEvolutionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEvolutionRequest" ADD CONSTRAINT "AccountEvolutionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
