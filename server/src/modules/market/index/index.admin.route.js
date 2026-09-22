import express from "express";
import runMarketSyncJob from "../../../jobs/marketSync.job.js";
import { authenticateAdmin } from "../../../shared/middleware/adminAuth.middleware.js";
import { canManageMarket } from "../../../shared/middleware/checkPermissions.middleware.js";
import {
  createIndex,
  deleteIndex,
  getAdminIndices,
  updateIndex,
} from "./index.controller.js";

const router = express.Router();

router.use(authenticateAdmin);
router.use(canManageMarket);

router.get("/indices", getAdminIndices);
router.post("/indices", createIndex);
router.put("/indices/:id", updateIndex);
router.delete("/indices/:id", deleteIndex);

router.post("/indices/sync-now", async (req, res) => {
  const result = await runMarketSyncJob();
  res.json({ success: true, result });
});

export default router;
