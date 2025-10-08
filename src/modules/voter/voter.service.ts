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
        return prisma.voter.findMany({ where: { addedById: userId }, include: { uik: true } });
    },

    async listByUik(uikCode: number) {
        return prisma.voter.findMany({ where: { uikCode } });
    },

    async remove(id: number) {
        return prisma.voter.delete({ where: { id } });
    },

    async update(id: number, data: Partial<VoterInput>) {
        return prisma.voter.update({ where: { id }, data });
    },
};
