import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const holdings = await prisma.treasuryHolding.findMany({
      orderBy: { assetName: "asc" },
    });

    if (req.user.role === "manager") {
      return res.status(200).json(
        holdings.map((h) => ({
          id: h.id,
          assetName: h.assetName,
          quantity: Number(h.quantity),
          buyPrice: Number(h.buyPrice),
          currentPrice: Number(h.currentPrice),
          currentValue: Number(h.quantity) * Number(h.currentPrice),
          gainLossPercent:
            Number(h.buyPrice) === 0
              ? 0
              : ((Number(h.currentPrice) - Number(h.buyPrice)) /
                  Number(h.buyPrice)) *
                100,
          lastPriceUpdate: h.lastPriceUpdate,
          updatedAt: h.updatedAt,
        })),
      );
    }

    return res.status(200).json(
      holdings.map((h) => ({
        assetName: h.assetName,
        currentValue: Number(h.quantity) * Number(h.currentPrice),
        gainLossPercent:
          Number(h.buyPrice) === 0
            ? 0
            : ((Number(h.currentPrice) - Number(h.buyPrice)) /
                Number(h.buyPrice)) *
              100,
      })),
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function buyTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { assetName, quantity, price } = req.body;

    if (
      !assetName ||
      typeof assetName !== "string" ||
      assetName.trim().length === 0
    ) {
      return res.status(400).json({ message: "Asset name is required" });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number" });
    }

    if (typeof price !== "number" || price <= 0) {
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }

    const existing = await prisma.treasuryHolding.findUnique({
      where: { assetName },
    });

    const newQuantity = new Prisma.Decimal(quantity);
    const newPrice = new Prisma.Decimal(price);

    let holding;

    if (existing) {
      const existingQuantity = existing.quantity;
      const existingBuyPrice = existing.buyPrice;

      const totalOldCost = existingQuantity.times(existingBuyPrice);
      const totalNewCost = newQuantity.times(newPrice);
      const totalQuantity = existingQuantity.plus(newQuantity);
      const weightedBuyPrice = totalOldCost
        .plus(totalNewCost)
        .div(totalQuantity);

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

export async function sellTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { assetName, quantity, price } = req.body;

    if (
      !assetName ||
      typeof assetName !== "string" ||
      assetName.trim().length === 0
    ) {
      return res.status(400).json({ message: "Asset name is required" });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number" });
    }

    if (typeof price !== "number" || price <= 0) {
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
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
