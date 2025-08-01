import { Router } from "express";
import {
  getAllAffiliates,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  incrementAffiliateUsage,
  getAffiliateDashboard,
} from "../handlers/affiliate-marketing-handlers";

const router = Router();

router.get("/api/admin/affiliates", getAllAffiliates);
router.post("/api/admin/affiliates", createAffiliate);
router.put("/api/admin/affiliates/:id", updateAffiliate);
router.delete("/api/admin/affiliates/:id", deleteAffiliate);
router.post(
  "/api/admin/affiliates/:id/increment-usage",
  incrementAffiliateUsage
);

// Add authentication check for affiliate dashboard
router.get(
  "/api/affiliate/dashboard",
  (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  },
  getAffiliateDashboard
);

export default router;
