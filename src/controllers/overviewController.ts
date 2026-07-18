import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getOverview(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const entryScope =
      req.user.role === "maker" ? { submittedBy: req.user.id } : {};

    const [monthEntries, pendingEntries] = await Promise.all([
      prisma.entry.findMany({
        where: {
          ...entryScope,
          deletedAt: null,
          status: "approved",
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
        select: { amount: true, type: true, category: true },
      }),
      prisma.entry.count({
        where: { ...entryScope, deletedAt: null, status: "submitted" },
      }),
    ]);

    let cashIn = 0;
    let cashOut = 0;
    const categoryTotals: Record<string, number> = {};

    for (const entry of monthEntries) {
      const amount = Number(entry.amount);
      if (entry.type === "in") cashIn += amount;
      if (entry.type === "out") cashOut += amount;
      categoryTotals[entry.category] =
        (categoryTotals[entry.category] ?? 0) + amount;
    }

    return res.status(200).json({
      periodStart: monthStart,
      periodEnd: nextMonthStart,
      cashIn,
      cashOut,
      netCashFlow: cashIn - cashOut,
      pendingEntries,
      approvedEntryCount: monthEntries.length,
      categoryTotals,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
