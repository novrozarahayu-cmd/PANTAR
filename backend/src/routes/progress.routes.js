import { Router } from "express";
import { uploadProgressImages, verifyMediaFiles } from "../middlewares/upload.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  listProgress,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress,
} from "../controllers/progress.controller.js";

const router = Router();
const staff = authorize("admin", "petugas");

router.get("/reports/:reportId/progress", listProgress);
router.get("/progress/:id", getProgressById);

router.post("/reports/:reportId/progress", authenticate, staff, uploadProgressImages, verifyMediaFiles, createProgress);
router.put("/progress/:id", authenticate, staff, uploadProgressImages, verifyMediaFiles, updateProgress);
router.delete("/progress/:id", authenticate, staff, deleteProgress);

export default router;
