
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import { Role } from "@prisma/client";
import {prisma} from "../../prisma/prisma";

interface RegisterInput {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    pin: string;
    password: string;
    role?: Role;
    coordinatorId?: number | null;
}

export const AuthService = {
    async register(input: RegisterInput) {
        const hashed = await bcrypt.hash(input.password, 10);
        const user = await prisma.user.create({
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
         user;
    },

    async login(phone: string, password: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) throw new Error("Пользователь не найден");
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Неверный пароль");

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        return { user, token };
    },

    async me(userId: number) {
        return prisma.user.findUnique({ where: { id: userId } });
    },
    async reset (id: number, oldPassword:string ,newPassword:string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error("Пользователь не найден");
        // Если передан старый пароль — проверим его
        const hashedNewPass = await bcrypt.hash(oldPassword, 10);
        console.log(user.password, hashedNewPass)
        if (oldPassword) {
            const valid = await bcrypt.compare(oldPassword, user.password);
            if (!valid) throw new Error("Неверный старый пароль");
        }

        // Проверка, что новый пароль не совпадает со старым (по смыслу)
        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) throw new Error("Новый пароль не может совпадать со старым");

        const hashed = await bcrypt.hash(newPassword, 10);

        return prisma.user.update({
            where: { id },
            data: { password: hashed },
        });
    }

};
