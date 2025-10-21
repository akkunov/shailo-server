
import { Role } from "@prisma/client";
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
        const bcrypt = await import("bcryptjs");
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
        const bcrypt = await import("bcryptjs");
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

    async update(id: number, data: Partial<CreateUserInput>) {
        // prevent updating password here directly; handle separate endpoint if needed
        const updateData: any = { ...data };
        if (data.password) {
            const bcrypt = await import("bcryptjs");
            updateData.password = await bcrypt.hash(data.password, 10);
        }
        return prisma.user.update({ where: { id }, data: updateData });
    },

    async remove(id: number) {
        await prisma.userUIK.deleteMany({ where: { userId: id } });

        // Потом удалить самого пользователя
        return prisma.user.delete({ where: { id } });
    },
    async reset (userId: number, password:string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("Пользователь не найден");
        const hashed = await bcrypt.hash(password, 10);
        if (hashed != user.password) throw new Error("Неверный пароль");
        if (hashed == user.password) throw new Error("Новый пароль не может быть похожим на старый!");
        return prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    }
};
