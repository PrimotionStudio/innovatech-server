import { jwtVerify } from "jose";
import { AdminSchema } from "./zod.js";
export const getUserIdFromContext = async (c) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token)
        return null;
    const secret = new TextEncoder().encode(process.env.APP_SECRET || "abc123xyz");
    const { payload } = await jwtVerify(token, secret);
    const admin = AdminSchema.omit({ password: true }).parse(payload);
    if (!payload || !admin)
        return null;
    return admin.id;
};
