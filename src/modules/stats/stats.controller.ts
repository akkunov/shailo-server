import { Response } from "express";
import { StatsService } from "./stats.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const StatsController = {
    async add(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            const { uikCode, count = 1, date } = req.body;

            if (!uikCode) return res.status(400).json({ message: "Не указан код УИКа" });

            const d = date ? new Date(date) : new Date();
            const result = await StatsService.upsertDaily(req.user.id, Number(uikCode), d, Number(count));

            res.json(result);
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: "Ошибка при добавлении статистики" });
        }
    },

    async byUser(req: AuthRequest, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const data = await StatsService.getByUser(userId);
            res.json(data);
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: "Ошибка при получении статистики пользователя" });
        }
    },

    async byUik(req: AuthRequest, res: Response) {
        try {
            const code = Number(req.params.code);
            const data = await StatsService.getByUik(code);
            res.json(data);
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: "Ошибка при получении статистики по УИКу" });
        }
    },

    /** ✅ Новый метод для фронта */
    async all(req: AuthRequest, res: Response) {
        try {
            const { startDate, endDate, uikCode, userId } = req.query;
            const data = await StatsService.getAll({
                startDate: startDate as string,
                endDate: endDate as string,
                uikCode: uikCode ? Number(uikCode) : undefined,
                userId: userId ? Number(userId) : undefined,
            });
            res.json(data);
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: "Ошибка при получении общей статистики" });
        }
    },

    /** ✅ Агрегированные данные (для графиков) */
    async aggregate(req: AuthRequest, res: Response) {
        try {
            const type = req.query.type as string;

            if (type === "user") {
                const data = await StatsService.aggregateByUser();
                return res.json(data);
            }

            if (type === "uik") {
                const data = await StatsService.aggregateByUik();
                return res.json(data);
            }

            res.status(400).json({ message: "Некорректный тип агрегации" });
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: "Ошибка при агрегации данных" });
        }
    },
};
