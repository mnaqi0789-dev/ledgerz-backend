import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function deleteEntry(req: Request, res: Response) {
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

    const [deletedEntry] = await prisma.$transaction([
      prisma.entry.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: req.user.id },
      }),
      prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: "deleted",
          actorId: req.user.id,
        },
      }),
    ]);

    return res.status(200).json(deletedEntry);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
