import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { getOverview } from "../controllers/overviewController";

const router = Router();

router.get("/", requireAuth, getOverview);

export default router;
