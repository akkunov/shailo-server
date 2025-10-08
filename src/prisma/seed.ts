// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import uiks from "./location.json";
const prisma = new PrismaClient();


async function main() {
    console.log("Start seeding UIKs...");

    for (const uik of uiks) {
        await prisma.uIK.upsert({
            where: { code: uik.code },
            update: {},
            create: {
                code: uik.code,
                name: uik.name,
            },
        });
    }

    console.log("UIKs seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
