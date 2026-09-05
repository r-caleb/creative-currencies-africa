-- AlterTable
ALTER TABLE "Discipline" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" TEXT;
