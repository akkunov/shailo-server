import {prisma} from "../../prisma/prisma";
import { Response } from "express";
import { VoterService } from "./voter.service";
import {AuthRequest} from "../../middleware/auth.middleware";
import ExcelJS from 'exceljs'

export const VoterController = {
    async createVoter(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ message: "Не авторизован" });
            // coordinator or agitator can create. Admin too.
            const allowedRoles = ["ADMIN", "COORDINATOR", "AGITATOR"];
            if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: "Нет доступа" });

            const payload = { ...req.body, addedById: req.user.id };
            const phone = await VoterService.findVoterByPhone(payload.phone);
            if(req.body.phone == phone) return res.status(400).json({ message: "Такой номер уже существует" });
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

    async  SearchVoters(req: AuthRequest, res: Response) {
        try {
            if (!["COORDINATOR", "AGITATOR"].includes(req.user?.role || ""))
                return res.status(403).json({ message: "Нет доступа" });

            const { search, skip, take } = req.query;
            const voters = await VoterService.searchVoters({
                search: search as string | undefined,
                skip: Number(skip) || 0,
                take: Number(take) || 20,
            });

            res.json(voters);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    },
    async votersSum(req:AuthRequest, res:Response){

        // 🔹 Получаем агитаторов и их УИКи
        const users = await prisma.voter.count();

        const countAgitators = await prisma.user.count({
            where: { role: "AGITATOR" },
        });

        console.log(countAgitators);
        res.json({users})
    },

    async exportVotersByUIK (req: AuthRequest, res: Response) {
        try {
            // --- 1️⃣ Получаем УИКи с количеством избирателей ---
            const uiks = await prisma.uIK.findMany({
                include: {
                    voters: true, // связь "уик → избиратели"
                },
            });

            // --- 2️⃣ Готовим данные ---
            const rows = uiks.map(uik => ({
                uikCode: uik.code,
                uikName: uik.name,
                voterCount: uik.voters.length,
            }));

            // --- 3️⃣ Создаем workbook ---
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Количество избирателей");

            sheet.columns = [
                { header: "Код УИКа", key: "uikCode", width: 12 },
                { header: "Название УИКа", key: "uikName", width: 35 },
                { header: "Координатор", key: "coordinator", width: 30 },
                { header: "Количество избирателей", key: "voterCount", width: 25 },
            ];

            sheet.addRows(rows);
            sheet.getRow(1).font = { bold: true };

            // --- 4️⃣ Добавляем итоговую строку ---
            const totalRow = sheet.addRow({
                uikCode: "Итого",
                voterCount: { formula: `SUM(D2:D${rows.length + 1})` },
            });
            totalRow.font = { bold: true };
            totalRow.alignment = { horizontal: "right" };

            // --- 5️⃣ Стилизация таблицы ---
            sheet.eachRow(row => {
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

            // --- 6️⃣ Создаем дополнительный лист с таблицей для диаграммы ---
            const chartSheet = workbook.addWorksheet("Диаграмма");
            chartSheet.addRow(["УИК", "Количество избирателей"]);
            rows.forEach(r => chartSheet.addRow([r.uikName, r.voterCount]));

            // ExcelJS не поддерживает встроенные диаграммы —
            // но таблица готова, и Excel может построить график вручную по данным.

            // --- 7️⃣ Отправка файла ---
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="voters_by_uik.xlsx"`
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Ошибка при экспорте избирателей:", error);
            res.status(500).json({ message: "Ошибка при генерации файла" });
        }
    },
    async voterByAgitatorId (req:AuthRequest, res:Response){
        try {
            const id = Number(req.params.id);
            const user = await VoterService.voterByAgitatorId(id)
            return res.json(user)

        }catch (error:any){
            res.status(400).json({ message: error.message});
        }
    }
};
