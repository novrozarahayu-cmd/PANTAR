import { Router } from "express";
import { getUsers, getUserById, updateUserRole, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
