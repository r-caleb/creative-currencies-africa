-- CreateTable
CREATE TABLE "CommunityGroupMessageReport" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "DirectMessageReportReason" NOT NULL DEFAULT 'OTHER',
    "message" TEXT,
    "status" "DirectMessageReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroupMessageReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupMessageReport_messageId_reporterId_key" ON "CommunityGroupMessageReport"("messageId", "reporterId");

-- CreateIndex
CREATE INDEX "CommunityGroupMessageReport_messageId_idx" ON "CommunityGroupMessageReport"("messageId");

-- CreateIndex
CREATE INDEX "CommunityGroupMessageReport_reporterId_idx" ON "CommunityGroupMessageReport"("reporterId");

-- CreateIndex
CREATE INDEX "CommunityGroupMessageReport_reason_idx" ON "CommunityGroupMessageReport"("reason");

-- CreateIndex
CREATE INDEX "CommunityGroupMessageReport_status_idx" ON "CommunityGroupMessageReport"("status");

-- CreateIndex
CREATE INDEX "CommunityGroupMessageReport_createdAt_idx" ON "CommunityGroupMessageReport"("createdAt");

-- AddForeignKey
ALTER TABLE "CommunityGroupMessageReport" ADD CONSTRAINT "CommunityGroupMessageReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CommunityGroupMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMessageReport" ADD CONSTRAINT "CommunityGroupMessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
