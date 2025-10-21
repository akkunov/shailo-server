import { prisma } from "../../prisma/prisma";
import { Role } from "@prisma/client";

export const UikService = {
    async create(code: number, name: string) {
        return prisma.uIK.create({ data: { code, name } });
    },

    async createMany(items: { code: number; name: string }[]) {
        return prisma.uIK.createMany({ data: items, skipDuplicates: true });
    },

    // 🔥 Теперь фильтруем по роли
    async list(userId: number, role: string) {
        // Если это админ или координатор — показываем все
        if (role === Role.ADMIN || role === Role.COORDINATOR) {
            return prisma.uIK.findMany({
                orderBy: { code: "asc" },
            });
        }

        // Если это агитатор — только его УИКи
        if (role === Role.AGITATOR) {
            return prisma.uIK.findMany({
                where: {
                    users: {
                        some: {
                            userId,
                        },
                    },
                },
                orderBy: { code: "asc" },
            });
        }

        // На всякий случай: если неизвестная роль
        return [];
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
