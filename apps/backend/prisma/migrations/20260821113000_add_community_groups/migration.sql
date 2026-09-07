-- CreateEnum
CREATE TYPE "CommunityGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommunityGroupVisibility" AS ENUM ('MEMBERS', 'PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CommunityGroupRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "CommunityGroupMessageType" AS ENUM ('TEXT', 'FILE', 'SYSTEM');

-- CreateTable
CREATE TABLE "CommunityGroup" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "CommunityGroupVisibility" NOT NULL DEFAULT 'MEMBERS',
    "status" "CommunityGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommunityGroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "CommunityGroupMessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentMimeType" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroup_slug_key" ON "CommunityGroup"("slug");

-- CreateIndex
CREATE INDEX "CommunityGroup_ownerId_idx" ON "CommunityGroup"("ownerId");

-- CreateIndex
CREATE INDEX "CommunityGroup_status_idx" ON "CommunityGroup"("status");

-- CreateIndex
CREATE INDEX "CommunityGroup_category_idx" ON "CommunityGroup"("category");

-- CreateIndex
CREATE INDEX "CommunityGroup_city_idx" ON "CommunityGroup"("city");

-- CreateIndex
CREATE INDEX "CommunityGroup_createdAt_idx" ON "CommunityGroup"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroupMembership_userId_idx" ON "CommunityGroupMembership"("userId");

-- CreateIndex
CREATE INDEX "CommunityGroupMembership_role_idx" ON "CommunityGroupMembership"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupMembership_groupId_userId_key" ON "CommunityGroupMembership"("groupId", "userId");

-- CreateIndex
CREATE INDEX "CommunityGroupMessage_groupId_createdAt_idx" ON "CommunityGroupMessage"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityGroupMessage_authorId_idx" ON "CommunityGroupMessage"("authorId");

-- CreateIndex
CREATE INDEX "CommunityGroupMessage_deletedAt_idx" ON "CommunityGroupMessage"("deletedAt");

-- AddForeignKey
ALTER TABLE "CommunityGroup" ADD CONSTRAINT "CommunityGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMembership" ADD CONSTRAINT "CommunityGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMembership" ADD CONSTRAINT "CommunityGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMessage" ADD CONSTRAINT "CommunityGroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroupMessage" ADD CONSTRAINT "CommunityGroupMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
