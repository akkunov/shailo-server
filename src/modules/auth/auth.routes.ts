import { Router } from "express";
import { AuthController } from "./auth.controller";
import {authMiddleware} from "../../middleware/auth.middleware";


const router = Router();
router.post("/register", AuthController.register); // public (but in prod only admin should be able to create coordinators)
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.put("/reset",authMiddleware, AuthController.reset);
router.get("/me", authMiddleware, AuthController.me);

export default router;
