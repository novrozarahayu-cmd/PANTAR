import { Router } from "express";
import { getSafeRoute, getHazards } from "../controllers/route.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.post("/safe", getSafeRoute);
router.get("/hazards", getHazards);

export default router;