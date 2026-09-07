-- CreateEnum
CREATE TYPE "NetworkConnectionKind" AS ENUM ('CONNECTION', 'FOLLOW');

-- CreateEnum
CREATE TYPE "NetworkConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "NetworkConnection"
ADD COLUMN "kind" "NetworkConnectionKind" NOT NULL DEFAULT 'CONNECTION',
ADD COLUMN "status" "NetworkConnectionStatus" NOT NULL DEFAULT 'ACCEPTED',
ADD COLUMN "respondedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "NetworkConnection_kind_idx" ON "NetworkConnection"("kind");

-- CreateIndex
CREATE INDEX "NetworkConnection_status_idx" ON "NetworkConnection"("status");
