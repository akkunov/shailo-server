import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const prisma = new PrismaClient();

export const AuthService = {
    async register(data: any) {
        const hashed = await bcrypt.hash(data.password, 10);
        return prisma.user.create({
            data: { ...data, password: hashed },
        });
    },

    async login(phone: string, password: string) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) throw new Error("Пользователь не найден");

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Неверный пароль");

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        return { user, token };
    },
};
