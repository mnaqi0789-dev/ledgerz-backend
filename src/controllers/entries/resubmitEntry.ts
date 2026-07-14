import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  VALID_ENTRY_TYPES,
  VALID_ENTRY_CATEGORIES,
} from "../../validators/entryValidators";

export async function resubmitEntry(req: Request, res: Response) {
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

    if (entry.submittedBy !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only resubmit your own entries" });
    }

    if (entry.status !== "rejected") {
      return res
        .status(409)
        .json({ message: "Only rejected entries can be resubmitted" });
    }

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

    const updatedEntry = await prisma.entry.update({
      where: { id },
      data: {
        amount,
        type,
        category,
        description,
        status: "submitted",
        decidedBy: null,
        decidedAt: null,
        rejectionReason: null,
      },
    });

    return res.status(200).json(updatedEntry);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
