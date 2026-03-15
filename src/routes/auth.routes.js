import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/**
 * Post  /api/auth/register
 */
authRouter.post("/register", authController.handleRegister);

export default authRouter;