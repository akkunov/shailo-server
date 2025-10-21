import {prisma} from "../../prisma/prisma";


interface VoterInput {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    pin?: string;
    address?: string;
    uikCode: number;
    addedById: number;
}

export const VoterService = {
    async create(input: VoterInput) {
        // optional: check uik exists
        return prisma.voter.create({ data: input });
    },

    async listByUser(userId: number) {
        return prisma.voter.findMany({ where: { addedById: userId }, include: { uik: true, addedBy: true } });
    },

    async findVoterByPhone(phone: string) {
        return prisma.voter.findFirst({ where: { phone } });
    },
    async listByUik(uikCode: number) {
        return prisma.voter.findMany({ where: { uikCode } });
    },

    async remove(id: number) {
        const voter = await prisma.voter.findUnique({
            where: { id: id },
        });

        if (!voter) throw new Error("Избиратель не найден");

        // Удаляем избирателя
        await prisma.voter.delete({ where: { id: id } });
        await prisma.stats.updateMany({
            where: {
                userId: voter.addedById,
                uikCode: voter.uikCode,
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // Сегодняшняя дата
                    lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
            data: {
                votersAdded: { decrement: 1 },
            },
        });

        return { success: true };
    },

    async update(id: number, data: Partial<VoterInput>) {
        return prisma.voter.update({ where: { id }, data });
    },
};
