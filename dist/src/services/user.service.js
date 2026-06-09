import { prisma } from "../lib/database.js";
export const GetUsers = async (c) => {
    const users = await prisma.user.findMany();
    return c.json(users);
};
