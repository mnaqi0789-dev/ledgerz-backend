import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateTreasuryInput } from "../../validators/treasuryValidators";

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
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.treasuryHolding.findUnique({ where: { assetName } });

      if (!existing) {
        return { error: "Holding not found", status: 404 };
      }

      if (existing.quantity.lessThan(sellQuantity)) {
        return { error: "Insufficient quantity to sell", status: 409 };
      }

      const holding = await tx.treasuryHolding.update({
        where: { assetName },
        data: { quantity: existing.quantity.minus(sellQuantity), currentPrice: sellPrice, lastPriceUpdate: new Date() },
      });
      const transaction = await tx.treasuryTransaction.create({
        data: { holdingId: holding.id, action: "sell", quantity: sellQuantity, price: sellPrice, executedBy: req.user.id },
      });
      await tx.auditLog.create({
        data: { refType: "treasury", refId: transaction.id, action: "sold", actorId: req.user.id },
      });

      return { holding };
    });

    if ("error" in result) {
      return res.status(result.status).json({ message: result.error });
    }

    return res.status(200).json(result.holding);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
