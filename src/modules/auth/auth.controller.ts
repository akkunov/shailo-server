import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export const AuthController = {
    async register(req: Request, res: Response) {
        try {
            const user = await AuthService.register(req.body);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { phone, password } = req.body;
            const result = await AuthService.login(phone, password);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },
};
