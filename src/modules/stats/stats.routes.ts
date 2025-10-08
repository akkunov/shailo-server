import { Router } from "express";
import { StatsController } from "./stats.controller";
import {authMiddleware} from "../../middleware/auth.middleware";
import {roleMiddleware} from "../../middleware/role.middleware";


const router = Router();

router.post("/add", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR","AGITATOR"]), StatsController.add);
router.get("/user/:userId", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR"]), StatsController.byUser);
router.get("/uik/:code", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR"]), StatsController.byUik);

export default router;

