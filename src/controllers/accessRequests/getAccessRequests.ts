import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function getAccessRequests(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const where: any = {};

    if (status && typeof status === "string") {
      const validStatuses = ["pending", "approved", "denied"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where.status = status;
    }

    const requests = await prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
