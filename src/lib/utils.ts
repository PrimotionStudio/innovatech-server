import type { Context } from "hono";
import { jwtVerify } from "jose";
import { AdminSchema } from "./zod.js";

export const getUserIdFromContext = async (c: Context) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  const secret = new TextEncoder().encode(
    process.env.APP_SECRET || "abc123xyz",
  );
  const { payload }: { payload: any } = await jwtVerify(token, secret);
  const admin = AdminSchema.omit({ password: true }).parse(payload);
  if (!payload || !admin) return null;
  return admin.id;
};
