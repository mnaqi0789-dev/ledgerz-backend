import { Request, Response, NextFunction } from "express";

export function requireRole(...allowedRoles: string[]) {
  return function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Response | void {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
