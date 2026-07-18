import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";

export async function approveAccessRequest(req: Request, res: Response) {
  return reviewAccessRequest(req, res, "approved");
}

export async function denyAccessRequest(req: Request, res: Response) {
  return reviewAccessRequest(req, res, "denied");
}

async function reviewAccessRequest(
  req: Request,
  res: Response,
  decision: "approved" | "denied",
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = Number(req.params["id"]);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!accessRequest) {
      return res.status(404).json({ message: "Access request not found" });
    }

    if (accessRequest.status !== "pending") {
      return res
        .status(409)
        .json({ message: `Request is already ${accessRequest.status}` });
    }

    if (decision === "approved") {
      const { password } = req.body;

      if (!password || typeof password !== "string" || password.length < 8) {
        return res
          .status(400)
          .json({ message: "A password of at least 8 characters is required" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          name: accessRequest.name,
          email: accessRequest.email,
          passwordHash,
          role: accessRequest.requestedRole,
        },
      });
    }

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: decision,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        refType: "access_request",
        refId: id,
        action: decision,
        actorId: req.user.id,
      },
    });

    return res.status(200).json({ request: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
