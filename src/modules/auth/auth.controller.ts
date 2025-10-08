import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { COOKIE_NAME, COOKIE_MAX_AGE } from "../../config";

export const AuthController = {
    async register(req: Request, res: Response) {
        try {
            const user = await AuthService.register(req.body);
            // не возвращаем пароль
            const { password, ...safe } = user as any;
            res.json(safe);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { phone, password } = req.body;
            const { user, token } = await AuthService.login(phone, password);

            res.cookie(COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: COOKIE_MAX_AGE,
            });

            const { password: pw, ...safe } = user as any;
            res.json({ user: safe });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async logout(req: Request, res: Response) {
        res.clearCookie(COOKIE_NAME);
        res.json({ message: "Logged out" });
    },

    async me(req: any, res: Response) {
        try {
            const user = await AuthService.me(req.user.id);
            const { password, ...safe } = user as any;
            res.json({ user: safe });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },
};
