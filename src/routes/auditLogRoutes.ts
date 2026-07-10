import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { getAuditLog } from "../controllers/auditLogController";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "manager"), getAuditLog);

export default router;
