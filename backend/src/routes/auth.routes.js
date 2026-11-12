import { Router } from "express";
import { register, login, me, updateMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

router.get("/me", authenticate, me);  // lihat profil sendiri, termasuk role dan isActive
router.post("/register", register);
router.post("/login", login);
router.patch("/me", authenticate, updateMe);  // update data diri sendiri, termasuk password

export default router;
