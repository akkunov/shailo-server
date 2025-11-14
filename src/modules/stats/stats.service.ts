import { prisma } from "../../prisma/prisma";

interface StatsQuery {
    skip?: number;
    take?: number;
    coordinatorId?: number;
    uikFilter?: number[];
    dateFrom?: Date;
    dateTo?: Date;
}


export const StatsService = {
    async getAgitatorStats(query: StatsQuery) {
        const {
            skip = 0,
            take = 10,
            coordinatorId,
            uikFilter,
            dateFrom,
            dateTo,
        } = query;

        // 1️⃣ Общий фильтр для подсчёта totalAgitators с учётом фильтров
        const baseFilter: any = {
            role: "AGITATOR",
            coordinatorId: coordinatorId || undefined,
            createdAt: {
                gte: dateFrom ? new Date(dateFrom) : undefined,
                lte: dateTo ? new Date(dateTo) : undefined,
            },
            uiks: uikFilter
                ? { some: { uikCode: { in: uikFilter } } }
                : undefined,
        };

        // 2️⃣ Получаем общее количество агитаторов по фильтрам
        const totalAgitators = await prisma.user.count({ where: baseFilter });

        // 3️⃣ Получаем агитаторов с фильтрацией и пагинацией
        const agitators = await prisma.user.findMany({
            where: baseFilter,
            take,
            skip,
            orderBy: { firstName: "asc" },
            include: {
                voters: true,
                uiks: { include: { uik: true } },
                coordinator: true,
            },
        });

        // 4️⃣ Общее количество избирателей для всех агитаторов с фильтрацией
        const totalVoters = await prisma.voter.count();

        // 5️⃣ Формируем результат
        const data = agitators.map(u => ({
            id: u.id,
            name: `${u.lastName} ${u.firstName} ${u.middleName || ""}`.trim(),
            coordinator: u.coordinator
                ? `${u.coordinator.lastName} ${u.coordinator.firstName}`
                : null,
            votersCount: u.voters.length,
            voters: u.voters,
            uiks: u.uiks.map(x => x.uik),
        }));

        return {
            totalAgitators,
            totalVoters,
            data,
            skip,
            take,
        };
    },
    async upsertDaily(userId: number, uikCode: number, date: Date, count: number) {
        const day = new Date(date);
        day.setHours(0, 0, 0, 0);

        return prisma.stats.upsert({
            where: {
                userId_uikCode_date: { userId, uikCode, date: day },
            },
            update: { votersAdded: { increment: count } },
            create: { userId, uikCode, date: day, votersAdded: count },
        });
    },

    async getByUser(userId: number) {
        return prisma.stats.findMany({
            where: { userId },
            orderBy: { date: "asc" },
            include: { uik: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    },

    async getByUik(uikCode: number) {
        return prisma.stats.findMany({
            where: { uikCode },
            orderBy: { date: "asc" },
            include: { user: true },
        });
    },

    /** ✅ Новый универсальный метод для аналитики */
    async getAll(filters?: {
        startDate?: string;
        endDate?: string;
        uikCode?: number;
        userId?: number;
    }) {
        const where: any = {};

        if (filters?.startDate && filters?.endDate) {
            where.date = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        }

        if (filters?.uikCode) where.uikCode = filters.uikCode;
        if (filters?.userId) where.userId = filters.userId;

        return prisma.stats.findMany({
            where,
            include: {
                user: { select: { id: true, firstName: true, lastName: true, role: true } },
                uik: { select: { code: true, name: true } },
            },
            orderBy: { date: "asc" },
        });
    },

    /** ✅ Группировка по агитаторам */
    async aggregateByUser() {
        const grouped = await prisma.stats.groupBy({
            by: ["userId"],
            _sum: { votersAdded: true },
            orderBy: { _sum: { votersAdded: "desc" } },
        });

        // 2. Получаем пользователей, которые нужны
        const userIds = grouped.map(g => g.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, phone: true }
        });

        // 3. Сочетаем статистику с данными пользователя
        return grouped.map(g => ({
            ...g,
            user: users.find(u => u.id === g.userId),
        }));
    },

    /** ✅ Группировка по УИКам */
    async aggregateByUik() {
        return prisma.stats.groupBy({
            by: ["uikCode"],
            _sum: { votersAdded: true },
            orderBy: { _sum: { votersAdded: "desc" } },
        });
    },


};
