import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  VALID_ENTRY_TYPES,
  VALID_ENTRY_CATEGORIES,
} from "../../validators/entryValidators";

export async function updateEntry(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = Number(req.params["id"]);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid entry id" });
    }

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry || entry.deletedAt) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const { amount, type, category, description } = req.body;
    const data: any = {};

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive number" });
      }
      data.amount = amount;
    }

    if (type !== undefined) {
      if (!VALID_ENTRY_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid entry type" });
      }
      data.type = type;
    }

    if (category !== undefined) {
      if (!VALID_ENTRY_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Invalid entry category" });
      }
      data.category = category;
    }

    if (description !== undefined) {
      data.description = description;
    }

    const [updatedEntry] = await prisma.$transaction([
      prisma.entry.update({ where: { id }, data }),
      prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: "edited",
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
