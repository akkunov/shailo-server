import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const allowRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: "Доступ запрещён" });
        }
        next();
    };
};
