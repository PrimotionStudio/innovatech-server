import { AdminSchema } from "../lib/zod.js";
import { prisma } from "../lib/database.js";
import { ApiError } from "../lib/errorHandler.js";
import { hash, compare } from "bcryptjs";
import { SignJWT } from "jose";
import { getUserIdFromContext } from "../lib/utils.js";
export const UserLogin = async (c) => {
    const data = AdminSchema.pick({ email: true, password: true }).parse(await c.req.json());
    const admin = await prisma.admin.findFirst({
        where: { email: { equals: data.email, mode: "insensitive" } },
    });
    if (!admin || !admin.password)
        throw new ApiError("Invalid login combination", 400);
    const isValidPassword = await compare(data.password, admin.password);
    if (!isValidPassword)
        throw new ApiError("Invalid login combination", 400);
    const secret = new TextEncoder().encode(process.env.APP_SECRET || "abc123xyz");
    const token = await new SignJWT(admin)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5h")
        .sign(secret);
    const { password, ...adm } = admin;
    return c.json({ token, admin: adm });
};
export const RegisterAdmin = async (c) => {
    const data = AdminSchema.omit({ id: true }).parse(await c.req.json());
    const hashed = await hash(data.password, 10);
    const admin = await prisma.admin.create({
        data: { ...data, password: hashed },
    });
    return c.json(admin, 201);
};
export const GetMe = async (c) => {
    const adminId = await getUserIdFromContext(c);
    if (!adminId)
        throw new ApiError("Cannot find user", 401);
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    return c.json(admin);
};
