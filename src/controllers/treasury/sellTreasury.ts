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

    const existing = await prisma.treasuryHolding.findUnique({
      where: { assetName },
    });

    if (!existing) {
      return res.status(404).json({ message: "Holding not found" });
    }

    const sellQuantity = new Prisma.Decimal(quantity);
    const sellPrice = new Prisma.Decimal(price);

    if (existing.quantity.lessThan(sellQuantity)) {
      return res.status(409).json({ message: "Insufficient quantity to sell" });
    }

    const remainingQuantity = existing.quantity.minus(sellQuantity);

    const holding = await prisma.treasuryHolding.update({
      where: { assetName },
      data: {
        quantity: remainingQuantity,
        currentPrice: sellPrice,
        lastPriceUpdate: new Date(),
      },
    });

    await prisma.treasuryTransaction.create({
      data: {
        holdingId: holding.id,
        action: "sell",
        quantity: sellQuantity,
        price: sellPrice,
        executedBy: req.user.id,
      },
    });

    return res.status(200).json(holding);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
