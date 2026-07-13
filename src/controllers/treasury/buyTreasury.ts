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

    const existing = await prisma.treasuryHolding.findUnique({
      where: { assetName },
    });

    const newQuantity = new Prisma.Decimal(quantity);
    const newPrice = new Prisma.Decimal(price);

    let holding;

    if (existing) {
      const totalQuantity = existing.quantity.plus(newQuantity);
      const weightedBuyPrice = weightedAverageCost(
        existing.quantity,
        existing.buyPrice,
        newQuantity,
        newPrice,
      );

      holding = await prisma.treasuryHolding.update({
        where: { assetName },
        data: {
          quantity: totalQuantity,
          buyPrice: weightedBuyPrice,
          currentPrice: newPrice,
          lastPriceUpdate: new Date(),
        },
      });
    } else {
      holding = await prisma.treasuryHolding.create({
        data: {
          assetName,
          quantity: newQuantity,
          buyPrice: newPrice,
          currentPrice: newPrice,
          lastPriceUpdate: new Date(),
        },
      });
    }

    await prisma.treasuryTransaction.create({
      data: {
        holdingId: holding.id,
        action: "buy",
        quantity: newQuantity,
        price: newPrice,
        executedBy: req.user.id,
      },
    });

    return res.status(201).json(holding);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
