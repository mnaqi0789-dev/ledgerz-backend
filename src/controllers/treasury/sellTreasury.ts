import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateTreasuryInput } from "../../validators/treasuryValidators";

class TreasuryActionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function sellTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { assetName, quantity, price } = req.body;

    const validationError = validateTreasuryInput(assetName, quantity, price);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const sellQuantity = new Prisma.Decimal(quantity);
    const sellPrice = new Prisma.Decimal(price);
    const userId = req.user.id;

    const holding = await prisma.$transaction(async (tx) => {
      const existing = await tx.treasuryHolding.findUnique({
        where: { assetName },
      });

      if (!existing) {
        throw new TreasuryActionError("Holding not found", 404);
      }

      if (existing.quantity.lessThan(sellQuantity)) {
        throw new TreasuryActionError("Insufficient quantity to sell", 409);
      }

      const updatedHolding = await tx.treasuryHolding.update({
        where: { assetName },
        data: {
          quantity: existing.quantity.minus(sellQuantity),
          currentPrice: sellPrice,
          lastPriceUpdate: new Date(),
        },
      });
      const transaction = await tx.treasuryTransaction.create({
        data: {
          holdingId: updatedHolding.id,
          action: "sell",
          quantity: sellQuantity,
          price: sellPrice,
          executedBy: userId,
        },
      });
      await tx.auditLog.create({
        data: {
          refType: "treasury",
          refId: transaction.id,
          action: "sold",
          actorId: userId,
        },
      });

      return updatedHolding;
    });

    return res.status(200).json(holding);
  } catch (err) {
    if (err instanceof TreasuryActionError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
