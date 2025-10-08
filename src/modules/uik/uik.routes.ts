import { Router } from "express";
import { UikController } from "./uik.controller";
import {authMiddleware} from "../../middleware/auth.middleware";
import {roleMiddleware} from "../../middleware/role.middleware";

const router = Router();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR"]), UikController.create);
router.post("/bulk", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR"]), UikController.createMany);
router.get("/", UikController.list);
router.get("/:code", authMiddleware, UikController.get);
router.put("/:code", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR"]), UikController.update);
router.delete("/:code", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR"]), UikController.remove);

export default router;
