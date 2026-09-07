-- CreateTable
CREATE TABLE "ResourceView" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceDownload" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUsefulMark" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceUsefulMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceView_resourceId_idx" ON "ResourceView"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceView_userId_idx" ON "ResourceView"("userId");

-- CreateIndex
CREATE INDEX "ResourceView_createdAt_idx" ON "ResourceView"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceDownload_resourceId_idx" ON "ResourceDownload"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceDownload_userId_idx" ON "ResourceDownload"("userId");

-- CreateIndex
CREATE INDEX "ResourceDownload_createdAt_idx" ON "ResourceDownload"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUsefulMark_resourceId_userId_key" ON "ResourceUsefulMark"("resourceId", "userId");

-- CreateIndex
CREATE INDEX "ResourceUsefulMark_resourceId_idx" ON "ResourceUsefulMark"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceUsefulMark_userId_idx" ON "ResourceUsefulMark"("userId");

-- CreateIndex
CREATE INDEX "ResourceUsefulMark_createdAt_idx" ON "ResourceUsefulMark"("createdAt");

-- AddForeignKey
ALTER TABLE "ResourceView" ADD CONSTRAINT "ResourceView_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceView" ADD CONSTRAINT "ResourceView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDownload" ADD CONSTRAINT "ResourceDownload_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDownload" ADD CONSTRAINT "ResourceDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsefulMark" ADD CONSTRAINT "ResourceUsefulMark_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsefulMark" ADD CONSTRAINT "ResourceUsefulMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
