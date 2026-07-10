import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createObjection,
  getObjections,
} from "../controllers/objectionController";

const router = Router();

router.post("/", requireAuth, requireRole("admin"), createObjection);
router.get("/", requireAuth, requireRole("admin"), getObjections);

export default router;
