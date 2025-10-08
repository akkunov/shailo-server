import {prisma} from "../../prisma/prisma";


export const UikService = {
    async create(code: number, name: string) {
        return prisma.uIK.create({ data: { code, name } });
    },

    async createMany(items: { code: number; name: string }[]) {
        // convert to createMany accepts objects matching model
        return prisma.uIK.createMany({ data: items, skipDuplicates: true });
    },

    async list() {
        return prisma.uIK.findMany();
    },

    async getByCode(code: number) {
        return prisma.uIK.findUnique({ where: { code } });
    },

    async update(code: number, name: string) {
        return prisma.uIK.update({ where: { code }, data: { name } });
    },

    async remove(code: number) {
        return prisma.uIK.delete({ where: { code } });
    },
};


