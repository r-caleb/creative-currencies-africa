-- CreateTable
CREATE TABLE "CommunityGroupJoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "CommunityGroupInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupJoinRequest_groupId_requesterId_pending_key" ON "CommunityGroupJoinRequest"("groupId", "requesterId") WHERE "status" = 'PENDING';

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_groupId_requesterId_status_idx" ON "CommunityGroupJoinRequest"("groupId", "requesterId", "status");

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_groupId_idx" ON "CommunityGroupJoinRequest"("groupId");

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_requesterId_status_idx" ON "CommunityGroupJoinRequest"("requesterId", "status");

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_reviewedById_idx" ON "CommunityGroupJoinRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_status_idx" ON "CommunityGroupJoinRequest"("status");

-- CreateIndex
CREATE INDEX "CommunityGroupJoinRequest_createdAt_idx" ON "CommunityGroupJoinRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "CommunityGroupJoinRequest" ADD CONSTRAINT "CommunityGroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupJoinRequest" ADD CONSTRAINT "CommunityGroupJoinRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupJoinRequest" ADD CONSTRAINT "CommunityGroupJoinRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
