
import { Request, Response } from "express";
import { VoterService } from "./voter.service";
import {AuthRequest} from "../../middleware/auth.middleware";

export const VoterController = {
    async createVoter(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            // coordinator or agitator can create. Admin too.
            const allowedRoles = ["ADMIN", "COORDINATOR", "AGITATOR"];
            if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: "Нет доступа" });

            const payload = { ...req.body, addedById: req.user.id };
            const voter = await VoterService.create(payload);
            res.json(voter);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async listMine(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            const voters = await VoterService.listByUser(req.user.id);
            res.json(voters);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async listByUik(req: AuthRequest, res: Response) {
        try {
            const code = Number(req.params.code);
            const list = await VoterService.listByUik(code);
            res.json(list);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async update(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const updated = await VoterService.update(id, req.body);
            res.json(updated);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async remove(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            await VoterService.remove(id);
            res.json({ message: "Deleted" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },
};
