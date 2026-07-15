import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  computeCurrentValue,
  computeGainLossPercent,
} from "../../lib/decimalMath";

export async function getTreasury(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const holdings = await prisma.treasuryHolding.findMany({
      where: { quantity: { gt: 0 } },
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
          currentValue: computeCurrentValue(h.quantity, h.currentPrice),
          gainLossPercent: computeGainLossPercent(h.currentPrice, h.buyPrice),
          lastPriceUpdate: h.lastPriceUpdate,
          updatedAt: h.updatedAt,
        })),
      );
    }

    return res.status(200).json(
      holdings.map((h) => ({
        assetName: h.assetName,
        currentValue: computeCurrentValue(h.quantity, h.currentPrice),
        gainLossPercent: computeGainLossPercent(h.currentPrice, h.buyPrice),
      })),
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
