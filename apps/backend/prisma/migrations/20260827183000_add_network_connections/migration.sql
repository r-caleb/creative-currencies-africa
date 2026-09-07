-- CreateTable
CREATE TABLE "NetworkConnection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkConnection_ownerId_memberId_key" ON "NetworkConnection"("ownerId", "memberId");

-- CreateIndex
CREATE INDEX "NetworkConnection_ownerId_idx" ON "NetworkConnection"("ownerId");

-- CreateIndex
CREATE INDEX "NetworkConnection_memberId_idx" ON "NetworkConnection"("memberId");

-- CreateIndex
CREATE INDEX "NetworkConnection_createdAt_idx" ON "NetworkConnection"("createdAt");

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkConnection" ADD CONSTRAINT "NetworkConnection_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
