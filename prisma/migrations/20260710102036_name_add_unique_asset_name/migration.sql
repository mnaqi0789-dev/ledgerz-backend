/*
  Warnings:

  - A unique constraint covering the columns `[asset_name]` on the table `treasury_holdings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "treasury_holdings_asset_name_key" ON "treasury_holdings"("asset_name");
