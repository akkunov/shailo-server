import { prisma } from "../../prisma/prisma";

export const StatsService = {
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
