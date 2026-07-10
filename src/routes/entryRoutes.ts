import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createEntry,
  getEntries,
  approveEntry,
  rejectEntry,
} from "../controllers/entryController";

const router = Router();

router.post("/", requireAuth, requireRole("maker", "manager"), createEntry);
router.get("/", requireAuth, getEntries);
router.patch("/:id/approve", requireAuth, requireRole("manager"), approveEntry);
router.patch("/:id/reject", requireAuth, requireRole("manager"), rejectEntry);

export default router;
