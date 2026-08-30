-- CreateEnum
CREATE TYPE "CommunityGroupInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CommunityGroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "role" "CommunityGroupRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CommunityGroupInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityGroupInvitation_groupId_idx" ON "CommunityGroupInvitation"("groupId");

-- CreateIndex
CREATE INDEX "CommunityGroupInvitation_inviteeId_status_idx" ON "CommunityGroupInvitation"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "CommunityGroupInvitation_inviterId_idx" ON "CommunityGroupInvitation"("inviterId");

-- CreateIndex
CREATE INDEX "CommunityGroupInvitation_status_idx" ON "CommunityGroupInvitation"("status");

-- CreateIndex
CREATE INDEX "CommunityGroupInvitation_createdAt_idx" ON "CommunityGroupInvitation"("createdAt");

-- AddForeignKey
ALTER TABLE "CommunityGroupInvitation" ADD CONSTRAINT "CommunityGroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupInvitation" ADD CONSTRAINT "CommunityGroupInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupInvitation" ADD CONSTRAINT "CommunityGroupInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
