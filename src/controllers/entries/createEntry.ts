import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  VALID_ENTRY_TYPES,
  VALID_ENTRY_CATEGORIES,
} from "../../validators/entryValidators";

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

    if (!VALID_ENTRY_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid entry type" });
    }

    if (!VALID_ENTRY_CATEGORIES.includes(category)) {
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
