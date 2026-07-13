import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

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
  rejectionReason: string | null = null,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = Number(req.params["id"]);

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
