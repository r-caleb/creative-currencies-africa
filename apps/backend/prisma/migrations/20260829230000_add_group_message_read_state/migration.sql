ALTER TABLE "CommunityGroupMembership" ADD COLUMN "lastReadAt" TIMESTAMP(3);

CREATE INDEX "CommunityGroupMembership_lastReadAt_idx" ON "CommunityGroupMembership"("lastReadAt");
