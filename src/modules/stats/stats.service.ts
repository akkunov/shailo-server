import {prisma} from "../../prisma/prisma";

export const StatsService = {
    async upsertDaily(userId: number, uikCode: number, date: Date, count: number) {
        // normalize date to yyyy-mm-dd midnight
        const day = new Date(date);
        day.setHours(0,0,0,0);
        return prisma.stats.upsert({
            where: {
                userId_uikCode_date: {
                    userId,
                    uikCode,
                    date: day
                }
            },
            update: {
                votersAdded: { increment: count }
            },
            create: {
                userId,
                uikCode,
                date: day,
                votersAdded: count
            }
        });
    },

    async getByUser(userId: number) {
        return prisma.stats.findMany({ where: { userId }, orderBy: { date: "asc" }, include: { uik: true } });
    },

    async getByUik(uikCode: number) {
        return prisma.stats.findMany({ where: { uikCode }, orderBy: { date: "asc" }, include: { user: true } });
    }
};

