/*
  Warnings:

  - The values [treasury] on the enum `AuditRefType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `treasury_holdings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `treasury_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditRefType_new" AS ENUM ('entry', 'objection', 'access_request');
ALTER TABLE "audit_log" ALTER COLUMN "ref_type" TYPE "AuditRefType_new" USING ("ref_type"::text::"AuditRefType_new");
ALTER TYPE "AuditRefType" RENAME TO "AuditRefType_old";
ALTER TYPE "AuditRefType_new" RENAME TO "AuditRefType";
DROP TYPE "public"."AuditRefType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "treasury_transactions" DROP CONSTRAINT "treasury_transactions_executed_by_fkey";

-- DropForeignKey
ALTER TABLE "treasury_transactions" DROP CONSTRAINT "treasury_transactions_holding_id_fkey";

-- DropTable
DROP TABLE "treasury_holdings";

-- DropTable
DROP TABLE "treasury_transactions";

-- DropEnum
DROP TYPE "TreasuryAction";
