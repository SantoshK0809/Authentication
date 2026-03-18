import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/**
 * Post  /api/auth/register
 */
authRouter.post("/register", authController.handleRegister);

/**
 * Post /api/auth/login
 */
authRouter.post("/login", authController.handleLogin);

/**
 *  Get  /api/auth/get-me
 */
authRouter.get("/get-me", authController.handleGetMe);

/**
 * Get  /api/auth/refresh-token
 */
authRouter.get("/refresh-token", authController.handleRefreshToken);

/**
 * Get /api/auth/logout
 */
authRouter.get("/logout", authController.handleLogout);

/**
 * Get /api/auth/logout-all
 */
authRouter.get("/logout-all", authController.handleLogoutAll);

/**
 * Get /api/auth/verify-email
 */
authRouter.get("/verify-email", authController.handleVerifyEmail);

export default authRouter;