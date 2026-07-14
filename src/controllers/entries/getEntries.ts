import { Request, Response } from "express";
import { EntryCategory, EntryStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  VALID_ENTRY_CATEGORIES,
  VALID_ENTRY_STATUSES,
} from "../../validators/entryValidators";

export async function getEntries(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { category, startDate, endDate, status } = req.query;

    const where: any = { deletedAt: null };

    if (req.user.role === "maker") {
      where.submittedBy = req.user.id;
    }

    if (category && typeof category === "string") {
      if (!VALID_ENTRY_CATEGORIES.includes(category as EntryCategory)) {
        return res.status(400).json({ message: "Invalid category filter" });
      }
      where.category = category;
    }

    if (status && typeof status === "string") {
      if (!VALID_ENTRY_STATUSES.includes(status as EntryStatus)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where.status = status;
    }

    if (
      startDate &&
      endDate &&
      typeof startDate === "string" &&
      typeof endDate === "string"
    ) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      where.createdAt = { gte: start, lte: end };
    }

    const entries = await prisma.entry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        submitter: { select: { id: true, name: true } },
        _count: { select: { objections: true } },
      },
    });

    return res.status(200).json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
