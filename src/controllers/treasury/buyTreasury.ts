import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateTreasuryInput } from "../../validators/treasuryValidators";
import { weightedAverageCost } from "../../lib/decimalMath";

export async function buyTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { assetName, quantity, price } = req.body;

    const validationError = validateTreasuryInput(assetName, quantity, price);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newQuantity = new Prisma.Decimal(quantity);
    const newPrice = new Prisma.Decimal(price);
    const holding = await prisma.$transaction(async (tx) => {
      const existing = await tx.treasuryHolding.findUnique({ where: { assetName } });
      const updatedHolding = existing
        ? await tx.treasuryHolding.update({
            where: { assetName },
            data: {
              quantity: existing.quantity.plus(newQuantity),
              buyPrice: weightedAverageCost(existing.quantity, existing.buyPrice, newQuantity, newPrice),
              currentPrice: newPrice,
              lastPriceUpdate: new Date(),
            },
          })
        : await tx.treasuryHolding.create({
            data: { assetName, quantity: newQuantity, buyPrice: newPrice, currentPrice: newPrice, lastPriceUpdate: new Date() },
          });

      const transaction = await tx.treasuryTransaction.create({
        data: { holdingId: updatedHolding.id, action: "buy", quantity: newQuantity, price: newPrice, executedBy: req.user.id },
      });

      await tx.auditLog.create({
        data: { refType: "treasury", refId: transaction.id, action: "bought", actorId: req.user.id },
      });

      return updatedHolding;
    });

    return res.status(201).json(holding);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
