import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const roleMiddleware = (roles: ("ADMIN" | "COORDINATOR" | "AGITATOR")[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: "Не авторизован" });

        if (!roles.includes(req.user.role as "ADMIN" | "COORDINATOR" | "AGITATOR")) return res.status(403).json({ message: "Нет доступа" });
        next();
    };
};
