import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { createObjection } from "../controllers/objectionController";

const router = Router();

router.post("/", requireAuth, requireRole("admin"), createObjection);

export default router;
