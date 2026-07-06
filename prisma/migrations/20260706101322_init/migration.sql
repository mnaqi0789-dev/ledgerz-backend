-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('maker', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('in', 'out', 'treasury_transfer');

-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('rent', 'salaries', 'client_payment', 'treasury', 'misc');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TreasuryAction" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "AuditRefType" AS ENUM ('entry', 'treasury', 'objection');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "EntryType" NOT NULL,
    "category" "EntryCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'submitted',
    "submitted_by" INTEGER NOT NULL,
    "decided_by" INTEGER,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_holdings" (
    "id" SERIAL NOT NULL,
    "asset_name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "buy_price" DECIMAL(65,30) NOT NULL,
    "current_price" DECIMAL(65,30) NOT NULL,
    "last_price_update" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_transactions" (
    "id" SERIAL NOT NULL,
    "holding_id" INTEGER NOT NULL,
    "action" "TreasuryAction" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "executed_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objections" (
    "id" SERIAL NOT NULL,
    "entry_id" INTEGER NOT NULL,
    "raised_by" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "ref_type" "AuditRefType" NOT NULL,
    "ref_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "treasury_holdings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
