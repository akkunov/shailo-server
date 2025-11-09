
import { Prisma, Role} from "@prisma/client";
import {prisma} from "../../prisma/prisma";
import bcrypt from "bcryptjs";

interface CreateUserInput {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    pin: string;
    password: string;
    role?: Role;
    coordinatorId?: number | null;
}
interface CreateAgitatorInput {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    pin: string;
    password: string;
    coordinatorId: number;
    uiks?: number[];
}

export const UserService = {
    async create(input: CreateUserInput) {
        // reuse AuthService.register logic? duplicating for clarity
        const hashed = await bcrypt.hash(input.password, 10);
        return prisma.user.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                middleName: input.middleName,
                phone: input.phone,
                pin: input.pin,
                password: hashed,
                role: input.role ?? Role.AGITATOR,
                coordinatorId: input.coordinatorId ?? null,
            },
        });
    },

    async createAgitator(input: CreateAgitatorInput) {

        const existingUser = await prisma.user.findMany({ where: { phone: input.phone } });
        if (existingUser.length) {
            // выбрасываем ошибку вместо простого return
            throw new Error("Пользователь уже существует");
        }
        const hashed = await bcrypt.hash(input.password, 10);

        // 1️⃣ Создаём агитатора
        const agitator = await prisma.user.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                middleName: input.middleName,
                phone: input.phone,
                pin: input.pin,
                password: hashed,
                role: Role.AGITATOR,
                coordinatorId: input.coordinatorId,
            },
        });

        // 2️⃣ Привязываем к УИКам (если есть)
        if (input.uiks?.length) {
            const data = input.uiks.map((code) => ({
                userId: agitator.id,
                uikCode: code,
            }));
            await prisma.userUIK.createMany({ data, skipDuplicates: true });
        }

        return prisma.user.findUnique({
            where: { id: agitator.id },
            include: { uiks: { include: { uik: true } } },
        });
    },

    async assignUIKs(userId: number, uikCodes: number[]) {
        const data = uikCodes.map((code) => ({ userId, uikCode: Number(code) }));
        return prisma.userUIK.createMany({ data, skipDuplicates: true });
    },

    async getAgitatorsByCoordinator(coordinatorId: number) {
        return prisma.user.findMany({
            where: { coordinatorId, role: Role.AGITATOR },
            include: { uiks: { include: { uik: true } } },
        });
    },
    async getCoordinatorVoters (coordinatorId:number) {
        const agitators = await prisma.user.findMany({
            where: { coordinatorId },
            select: { id: true },
        });

        const agitatorIds = agitators.map(a => a.id);

        // Вытащим всех избирателей, добавленных этими агитаторами
        const voters = await prisma.voter.findMany({
            where: { addedById: { in: agitatorIds } },
            include: {
                addedBy: true, // чтобы видеть, кто добавил
                uik: true,     // чтобы видеть, из какого УИК
            },
            orderBy: { createdAt: "desc" },
        });

        return voters;
    },
    async getCoordinators() {
        // Возвращаем только корреспондентов (админ видит всех)
        return prisma.user.findMany({
            where: { role: { in: [Role.COORDINATOR] } },
            include: { uiks: { include: { uik: true } } },
        });
    },

    async getAgitators() {
        // Возвращаем только корреспондентов (админ видит всех)
        return prisma.user.findMany({
    where: { role: { in: [Role.AGITATOR] } },
            include: { uiks: { include: { uik: true } } },
        });
    },
    async getVoters() {
        // Возвращаем только корреспондентов (админ видит всех)
        return prisma.voter.findMany({
            orderBy: { createdAt: "desc" },
        });
    },


    async getAll() {
        // Возвращаем только корреспондентов (админ видит всех)
        return prisma.user.findMany({
            where: { role: { in: [Role.ADMIN, Role.COORDINATOR, Role.AGITATOR] } },
            include: { uiks: { include: { uik: true } } },
        });
    },

    async getById(id: number) {
        return prisma.user.findUnique({ where: { id }, include: { uiks: { include: { uik: true } } } });
    },

    async update(id: number, data: Partial<CreateUserInput> & { uiks?: number[] }) {
        // Разделяем поля пользователя и УИКи
        const { uiks, ...userData } = data;

        // 1️⃣ Обновляем поля пользователя
        const updatedUser = await prisma.user.update({
            where: { id },
            data: userData,
        });

        // 2️⃣ Обновляем привязку к УИКам, если пришли
        if (uiks) {
            // Удаляем те, которых нет в новом массиве
            await prisma.userUIK.deleteMany({
                where: {
                    userId: id,
                    NOT: {
                        uikCode: { in: uiks },
                    },
                },
            });

            // Добавляем новые (skipDuplicates чтобы не создавать дубликаты)
            const dataToInsert = uiks.map((code) => ({ userId: id, uikCode: code }));
            await prisma.userUIK.createMany({ data: dataToInsert, skipDuplicates: true });
        }

        // 3️⃣ Возвращаем обновленного пользователя с актуальными УИКами
        return prisma.user.findUnique({
            where: { id },
            include: { uiks: { include: { uik: true } } },
        });
    },
    async remove(id: number) {
        await prisma.userUIK.deleteMany({ where: { userId: id } });

        // Потом удалить самого пользователя
        return prisma.user.delete({ where: { id } });
    },

    async searchAgitators(query: { search?: string; skip?: number; take?: number }) {
        const { search, skip = 0, take = 20 } = query;

        const where: Prisma.UserWhereInput = {
            role: Role.AGITATOR,
            ...(search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                        { middleName: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search } },
                    ],
                }
                : {}),
        };

        return prisma.user.findMany({
            where,
            skip,
            take,
            include: { uiks: { include: { uik: true } } },
            orderBy: { lastName: "asc" },
        });
    }
};
