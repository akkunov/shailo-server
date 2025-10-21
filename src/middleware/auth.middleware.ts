import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export interface AuthRequest extends Request {
    user?: { id: number; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Не авторизован" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        console.log(decoded);
        req.user = { id: decoded.id ?? decoded.userId ?? decoded.user?.id, role: decoded.role ?? decoded.user?.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Неверный токен" });
    }
}
