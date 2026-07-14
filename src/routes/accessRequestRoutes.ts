import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createAccessRequest,
  getAccessRequests,
  approveAccessRequest,
  denyAccessRequest,
} from "../controllers/accessRequests";

const router = Router();

router.post("/", createAccessRequest);
router.get(
  "/",
  requireAuth,
  requireRole("manager", "admin"),
  getAccessRequests,
);
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("manager"),
  approveAccessRequest,
);
router.patch(
  "/:id/deny",
  requireAuth,
  requireRole("manager"),
  denyAccessRequest,
);

export default router;
