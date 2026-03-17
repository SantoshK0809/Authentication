import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/**
 * Post  /api/auth/register
 */
authRouter.post("/register", authController.handleRegister);

/**
 *  Get  /api/auth/get-me
 */
authRouter.get("/get-me", authController.getMe);

/**
 * Get  /api/auth/refresh-token
 */
authRouter.get("/refresh-token", authController.refreshToken);

export default authRouter;