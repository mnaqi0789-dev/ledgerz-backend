import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createObjection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { entryId, note } = req.body;

    if (!entryId || typeof entryId !== "number") {
      return res.status(400).json({ message: "entryId is required" });
    }

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return res.status(400).json({ message: "Note is required" });
    }

    const entry = await prisma.entry.findUnique({ where: { id: entryId } });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    if (entry.deletedAt) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const objection = await prisma.$transaction(async (tx) => {
      const createdObjection = await tx.objection.create({
        data: { entryId, raisedBy: req.user.id, note },
      });
      await tx.auditLog.create({
        data: { refType: "objection", refId: createdObjection.id, action: "raised", actorId: req.user.id },
      });
      return createdObjection;
    });

    return res.status(201).json(objection);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getObjections(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const objections = await prisma.objection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        entry: {
          select: { id: true, description: true, amount: true, status: true },
        },
        raiser: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(objections);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
