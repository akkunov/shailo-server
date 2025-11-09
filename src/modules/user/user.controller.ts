import { Response } from "express";
import { UserService } from "./user.service";
import { Role } from "@prisma/client";
import {AuthRequest} from "../../middleware/auth.middleware";
import {prisma} from "../../prisma/prisma";
import * as ExcelJS from "exceljs";
import * as path from "node:path";

interface ExpandedRow {
    id: number;
    fullName: string;
    phone: string;
    pin: string;
    uikCode: number ;
    uikName: string;
    coordinator: string;
}

export const UserController = {
    // Admin creates coordinator
    async createCoordinator(req: AuthRequest, res: Response) {
        try {
            if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Нет доступа" });

            const payload = req.body;
            console.log(req.body)
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
            const pass = 'Pass200042-'
            const user = await UserService.createAgitator({ ...payload, role: Role.AGITATOR, coordinatorId: req.user.id, password:pass });
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
            res.json(updated);
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
    async getCoordinatorsVoters (req:AuthRequest, res:Response) {
        try{
            const coordinatorId = Number(req.params.id)
            const voters = await UserService.getCoordinatorVoters(coordinatorId);
            res.json(voters)
        }catch (arr:any){
            res.status(400).json({message:arr.message})
        }
    },
    async exportAgitatorsByUIK (req:AuthRequest,res:Response){
        try {
            const users = await prisma.user.findMany({
                where: { role: "AGITATOR" },
                include: {
                    uiks: { include: { uik: true } },
                    coordinator: true,
                },
            });

            const workbook = new ExcelJS.Workbook();

            // --- 1️⃣ Лист "Агитаторы": только первый УИК ---
            const rows = users.map(user => {
                const coordName = user.coordinator
                    ? `${user.coordinator.lastName} ${user.coordinator.firstName}`
                    : "—";

                const firstUik = user.uiks[0];

                return {
                    id: user.id,
                    fullName: `${user.lastName} ${user.firstName} ${user.middleName || ""}`.trim(),
                    phone: user.phone,
                    pin: user.pin,
                    uikCode: firstUik?.uik.code ?? 0,
                    uikName: firstUik?.uik.name ?? "—",
                    coordinator: coordName,
                };
            });

            const dataSheet = workbook.addWorksheet("Агитаторы");
            dataSheet.columns = [
                { header: "ID", key: "id", width: 8 },
                { header: "ФИО", key: "fullName", width: 30 },
                { header: "Телефон", key: "phone", width: 15 },
                { header: "PIN", key: "pin", width: 15 },
                { header: "Код УИКа", key: "uikCode", width: 12 },
                { header: "Название УИКа", key: "uikName", width: 35 },
                { header: "Координатор", key: "coordinator", width: 25 },
            ];
            dataSheet.addRows(rows);
            dataSheet.getRow(1).font = { bold: true };

            // --- 2️⃣ Лист "Статистика" по всем УИКам ---
            type UikInfo = { name: string; count: number; coordinators: string[] };
            const uikStats = new Map<number, UikInfo>();

            users.forEach(user => {
                const coordName = user.coordinator
                    ? `${user.coordinator.lastName} ${user.coordinator.firstName}`
                    : "—";

                user.uiks.forEach(uu => {
                    if (!uikStats.has(uu.uik.code)) {
                        uikStats.set(uu.uik.code, { name: uu.uik.name, count: 0, coordinators: [] });
                    }
                    const entry = uikStats.get(uu.uik.code)!;
                    entry.count += 1;
                    if (!entry.coordinators.includes(coordName)) entry.coordinators.push(coordName);
                });
            });

            const statsData = Array.from(uikStats.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([code, { name, count, coordinators }]) => ({
                    uikCode: code,
                    uikName: name,
                    count,
                    coordinators: coordinators.join(", "),
                }));

            const statsSheet = workbook.addWorksheet("Статистика");
            statsSheet.columns = [
                { header: "Код УИКа", key: "uikCode", width: 12 },
                { header: "Название УИКа", key: "uikName", width: 35 },
                { header: "Количество агитаторов", key: "count", width: 25 },
                { header: "Координаторы", key: "coordinators", width: 40 },
            ];
            statsSheet.addRows(statsData);
            statsSheet.getRow(1).font = { bold: true };

            // --- 3️⃣ Сумма по УИКам ---
            const totalRow = statsSheet.addRow({
                uikCode: "Итого",
                count: { formula: `SUM(C2:C${statsData.length + 1})` },
            });
            totalRow.font = { bold: true };
            totalRow.alignment = { horizontal: "right" };

            // --- 4️⃣ Стили и границы ---
            statsSheet.eachRow(row => {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { vertical: "middle", horizontal: "center" };
                });
            });

            // --- 5️⃣ Диаграмма гистограмма ---
            const chartSheet = workbook.addWorksheet("Диаграмма");
            const chartLabels = statsData.map(d => d.uikName);
            const chartValues = statsData.map(d => d.count);

            // Простая таблица для графика
            chartSheet.addRow(["УИК", "Количество"]);
            chartLabels.forEach((label, idx) => chartSheet.addRow([label, chartValues[idx]]));

            // ExcelJS не поддерживает полноценные диаграммы через JS API,
            // но можно оставить таблицу для быстрой вставки диаграммы вручную в Excel.

            // --- 6️⃣ Отправка файла ---
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="agitators_by_uik.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Ошибка при экспорте:", error);
            res.status(500).json({ message: "Ошибка при генерации файла" });
        }
    },
    async AgitSumm(req:AuthRequest, res:Response){
        const countAgitators = await prisma.user.count({
            where: { role: "AGITATOR" },
        });

        console.log(countAgitators);
        res.json(countAgitators)
    },

    async Search(req:AuthRequest, res:Response){
        try {
            const { search, skip, take } = req.query;
            const agitators = await UserService.searchAgitators({
                search: search as string | undefined,
                skip: Number(skip) || 0,
                take: Number(take) || 20,
            });

            res.json(agitators);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
}
};
