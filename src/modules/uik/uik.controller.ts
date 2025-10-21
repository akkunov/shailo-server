import { Request, Response } from "express";
import { UikService } from "./uik.service";
import {AuthRequest} from "../../middleware/auth.middleware";

export const UikController = {
    async create(req: Request, res: Response) {
        try {
            const { code, name } = req.body;
            const uik = await UikService.create(Number(code), name);
            res.json(uik);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async createMany(req: Request, res: Response) {
        try {
            const items = req.body; // [{code, name}, ...]
            await UikService.createMany(items);
            res.json({ message: "OK" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async list(req: AuthRequest, res: Response) {
        const id = req.user?.id
        const role = req.user?.role
        if (!id || !role)  return res.status(401).json({ message: "Unauthorized" });
        const list = await UikService.list(id, role);
        res.json(list);
    },

    async get(req: Request, res: Response) {
        const code = Number(req.params.code);
        const uik = await UikService.getByCode(code);
        res.json(uik);
    },

    async update(req: Request, res: Response) {
        const code = Number(req.params.code);
        const { name } = req.body;
        const uik = await UikService.update(code, name);
        res.json(uik);
    },

    async remove(req: Request, res: Response) {
        const code = Number(req.params.code);
        await UikService.remove(code);
        res.json({ message: "Deleted" });
    },
};
