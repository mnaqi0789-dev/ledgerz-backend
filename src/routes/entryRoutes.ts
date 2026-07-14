import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createEntry,
  getEntries,
  approveEntry,
  rejectEntry,
  updateEntry,
  deleteEntry,
  resubmitEntry,
} from "../controllers/entries";

const router = Router();

router.post("/", requireAuth, requireRole("maker", "manager"), createEntry);
router.get("/", requireAuth, getEntries);
router.patch("/:id/approve", requireAuth, requireRole("manager"), approveEntry);
router.patch("/:id/reject", requireAuth, requireRole("manager"), rejectEntry);
router.patch("/:id/resubmit", requireAuth, requireRole("maker"), resubmitEntry);
router.put("/:id", requireAuth, requireRole("manager"), updateEntry);
router.delete("/:id", requireAuth, requireRole("manager"), deleteEntry);

export default router;
