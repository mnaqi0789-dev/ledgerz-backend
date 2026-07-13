import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  getTreasury,
  buyTreasury,
  sellTreasury,
} from "../controllers/treasury";

const router = Router();

router.get("/", requireAuth, getTreasury);
router.post("/buy", requireAuth, requireRole("manager"), buyTreasury);
router.post("/sell", requireAuth, requireRole("manager"), sellTreasury);

export default router;
