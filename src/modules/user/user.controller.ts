import { Response } from "express";
import { UserService } from "./user.service";
import { Role } from "@prisma/client";
import {AuthRequest} from "../../middleware/auth.middleware";

export const UserController = {
    // Admin creates coordinator
    async createCoordinator(req: AuthRequest, res: Response) {
        try {
            if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Нет доступа" });

            const payload = req.body;
            const user = await UserService.create({ ...payload, role: Role.COORDINATOR });
            const { password, ...safe } = user as any;
            res.json(safe);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },


    async getCoordinators (req: AuthRequest, res:Response ){
        try {
            const user = req.user; // В authMiddleware добавляем user
            if (!user) return res.status(401).json({ message: "Не авторизован" });

            if (user.role !== "ADMIN") {
                return res.status(403).json({ message: "Доступ запрещен" });
            }
            const users = await UserService.getCoordinators()
            res.json(users)
        } catch (err: any) {
            res.status(500).json({ message: "Ошибка сервера", error: err });
        }
    },
    async getAgitators (req: AuthRequest, res:Response ){
        try {
            const user = req.user; // В authMiddleware добавляем user
            if (!user) return res.status(401).json({ message: "Не авторизован" });

            if (user.role !== "ADMIN") {
                return res.status(403).json({ message: "Доступ запрещен" });
            }
            const users = await UserService.getAgitators()
            res.json(users)
        } catch (err: any) {
            res.status(500).json({ message: "Ошибка сервера", error: err });
        }
    },

    async getVoters (req: AuthRequest, res:Response ){
        try {
            const user = req.user; // В authMiddleware добавляем user
            if (!user) return res.status(401).json({ message: "Не авторизован" });

            if (user.role !== "ADMIN") {
                return res.status(403).json({ message: "Доступ запрещен" });
            }
            const users = await UserService.getVoters()
            res.json(users)
        } catch (err: any) {
            res.status(500).json({ message: "Ошибка сервера", error: err });
        }
    },



    // Coordinator creates agitator
    async createAgitator(req: AuthRequest, res: Response) {
        try {
            if (req.user?.role !== "COORDINATOR" ) return res.status(403).json({ message: "Нет доступа" });

            const payload = req.body;
            console.log(req.user)
            const pass = 'Pass200042-'
            const user = await UserService.create({ ...payload, role: Role.AGITATOR, coordinatorId: req.user.id, password:pass });
            const { password, ...safe } = user as any;
            res.json(safe);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    // Coordinator can assign UIKs to agitator
    async assignUIKs(req: AuthRequest, res: Response) {
        try {
            const { userId, uikCodes } = req.body;
            // Only coordinator who is owner OR admin can assign

            console.log(userId)
            const actorRole = req.user?.role;
            if (actorRole !== "COORDINATOR") return res.status(403).json({ message: "Нет доступа" });

            // If coordinator, ensure agitator belongs to them
            if (actorRole === "COORDINATOR") {
                const agitator = await UserService.getById(userId);
                console.log(agitator, 'agitator')
                if (agitator?. id !== req.user?.id) return res.status(403).json({ message: "Нет доступа" });
            }

            await UserService.assignUIKs(userId, uikCodes);
            res.json({ message: "Assigned" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async listAgitators(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            if (req.user.role === "COORDINATOR") {
                const list = await UserService.getAgitatorsByCoordinator(req.user.id);
                return res.json(list);
            }
            if (req.user.role === "ADMIN") {
                const list = await UserService.getAll();
                return res.json(list);
            }
            return res.status(403).json({ message: "Нет доступа" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async getUser(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            const user = await UserService.getById(id);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async updateUser(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            // only admin or self or coordinator (for their agitators) can update — implement as needed
            const updated = await UserService.update(id, req.body);
            const { password, ...safe } = updated as any;
            res.json(safe);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },

    async deleteUser(req: AuthRequest, res: Response) {
        try {
            const id = Number(req.params.id);
            await UserService.remove(id);
            res.json({ message: "Deleted" });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },
};
