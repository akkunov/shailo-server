import { Router } from "express";
import { StatsController } from "./stats.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

// добавление статистики
router.post("/add", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR", "AGITATOR"]), StatsController.add);

// статистика по пользователю / УИК
router.get("/user/:userId", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR"]), StatsController.byUser);
router.get("/uik/:code", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR"]), StatsController.byUik);

// новая — универсальная аналитика
router.get("/all", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR"]), StatsController.all);

// новая — агрегация для графиков
router.get("/aggregate", authMiddleware, roleMiddleware(["ADMIN", "COORDINATOR"]), StatsController.aggregate);

export default router;
