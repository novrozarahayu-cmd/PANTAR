import { Router } from "express";
import crypto from "crypto";
import { authenticate, authorize } from "../middlewares/auth.js";
import { processQueue, validationStats } from "../controllers/validation.controller.js";

const router = Router();

// Cron (mis. Vercel Cron) mengirim "Authorization: Bearer <CRON_SECRET>". Petugas memakai JWT biasa.
const staffOrCron = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (secret && scheme === "Bearer" && token) {
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  return authenticate(req, res, (err) => {
    if (err) return next(err);
    return authorize("admin", "petugas")(req, res, next);
  });
};

router.get("/process", staffOrCron, processQueue);
router.post("/process", staffOrCron, processQueue);
router.get("/stats", authenticate, authorize("admin", "petugas"), validationStats);

export default router;
