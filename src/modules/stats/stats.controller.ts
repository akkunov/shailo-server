import { Request, Response } from "express";
import { StatsService } from "./stats.service";
import {AuthRequest} from "../../middleware/auth.middleware";


export const StatsController = {
    async add(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            const { uikCode, count = 1, date } = req.body;
            const d = date ? new Date(date) : new Date();
            const result = await StatsService.upsertDaily(req.user.id, Number(uikCode), d, Number(count));
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async byUser(req: AuthRequest, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const data = await StatsService.getByUser(userId);
            res.json(data);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async byUik(req: AuthRequest, res: Response) {
        try {
            const code = Number(req.params.code);
            const data = await StatsService.getByUik(code);
            res.json(data);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }
};
