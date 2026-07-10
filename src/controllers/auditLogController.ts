import { Request, Response } from "express";
import { PrismaClient, AuditRefType } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_REF_TYPES = Object.values(AuditRefType);

export async function getAuditLog(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { refType } = req.query;

    const where: any = {};

    if (refType && typeof refType === "string") {
      if (!VALID_REF_TYPES.includes(refType as AuditRefType)) {
        return res.status(400).json({ message: "Invalid ref_type filter" });
      }
      where.refType = refType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json(logs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
