import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function createAccessRequest(req: Request, res: Response) {
  try {
    const { name, email, requestedRole, note } = req.body;

    if (!name || !email || !requestedRole) {
      return res
        .status(400)
        .json({ message: "Name, email, and requested role are required" });
    }

    const validRoles = ["maker", "manager", "admin"];
    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({ message: "Invalid requested role" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const accessRequest = await prisma.accessRequest.create({
      data: { name, email, requestedRole, note: note ?? null },
    });

    return res.status(201).json(accessRequest);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
