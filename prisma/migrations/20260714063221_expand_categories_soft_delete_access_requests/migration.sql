-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'approved', 'denied');

-- AlterEnum
ALTER TYPE "AuditRefType" ADD VALUE 'access_request';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EntryCategory" ADD VALUE 'utilities';
ALTER TYPE "EntryCategory" ADD VALUE 'vendor_payment';
ALTER TYPE "EntryCategory" ADD VALUE 'office_supplies';
ALTER TYPE "EntryCategory" ADD VALUE 'travel';
ALTER TYPE "EntryCategory" ADD VALUE 'marketing';
ALTER TYPE "EntryCategory" ADD VALUE 'software_subscriptions';
ALTER TYPE "EntryCategory" ADD VALUE 'insurance';
ALTER TYPE "EntryCategory" ADD VALUE 'taxes';
ALTER TYPE "EntryCategory" ADD VALUE 'professional_fees';
ALTER TYPE "EntryCategory" ADD VALUE 'equipment';

-- AlterTable
ALTER TABLE "entries" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" INTEGER;

-- CreateTable
CREATE TABLE "access_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requested_role" "UserRole" NOT NULL,
    "note" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
