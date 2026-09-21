// filepath: /Users/sergeydaub/Documents/work/crm/backend/src/routes/authRoutes.ts
import express from "express";
import { login, getCurrentUser, logout } from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticateToken, getCurrentUser);
router.post("/logout", authenticateToken, logout);

export default router;