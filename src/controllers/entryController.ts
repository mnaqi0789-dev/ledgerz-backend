import { Request, Response } from "express";
import { PrismaClient, EntryType, EntryCategory } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_TYPES = Object.values(EntryType);
const VALID_CATEGORIES = Object.values(EntryCategory);

export async function createEntry(req: Request, res: Response) {
  try {
    const { amount, type, category, description } = req.body;

    if (amount === undefined || !type || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid entry type" });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid entry category" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const entry = await prisma.entry.create({
      data: {
        amount,
        type,
        category,
        description,
        submittedBy: req.user.id,
      },
    });

    return res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getEntries(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { category, startDate, endDate } = req.query;

    const where: any = {};

    if (req.user.role === "maker") {
      where.submittedBy = req.user.id;
    }

    if (category && typeof category === "string") {
      if (!VALID_CATEGORIES.includes(category as EntryCategory)) {
        return res.status(400).json({ message: "Invalid category filter" });
      }
      where.category = category;
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
    });

    return res.status(200).json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveEntry(req: Request, res: Response) {
  return decideEntry(req, res, "approved");
}

export async function rejectEntry(req: Request, res: Response) {
  const { rejectionReason } = req.body;

  if (
    !rejectionReason ||
    typeof rejectionReason !== "string" ||
    rejectionReason.trim().length === 0
  ) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  return decideEntry(req, res, "rejected", rejectionReason);
}

async function decideEntry(
  req: Request,
  res: Response,
  newStatus: "approved" | "rejected",
  rejectionReason?: string,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid entry id" });
    }

    const entry = await prisma.entry.findUnique({ where: { id } });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (entry.status !== "submitted") {
      return res
        .status(409)
        .json({ message: `Entry is already ${entry.status}` });
    }

    const [updatedEntry] = await prisma.$transaction([
      prisma.entry.update({
        where: { id },
        data: {
          status: newStatus,
          decidedBy: req.user.id,
          decidedAt: new Date(),
          rejectionReason: newStatus === "rejected" ? rejectionReason : null,
        },
      }),
      prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: newStatus,
          actorId: req.user.id,
        },
      }),
    ]);

    return res.status(200).json(updatedEntry);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
