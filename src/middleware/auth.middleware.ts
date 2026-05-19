import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { prisma } from "../lib/database.js";
import { ApiError } from "../lib/errorHandler.js";
import { ZodError } from "zod";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AdminSchema, type AdminType } from "../lib/zod.js";

const isDev = process.env.NODE_ENV !== "production";

export const AuthMiddleware = createMiddleware<{
  Variables: { user: AdminType };
}>(async (c: Context, next: Next) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Unauthorized" }, 401);
    const secret = new TextEncoder().encode(
      process.env.APP_SECRET || "abc123xyz",
    );
    const { payload } = await jwtVerify<AdminType>(token, secret);
    const admin = AdminSchema.parse(payload);
    if (!admin) throw new ApiError("Forbidden", 403);
    const dbAdmin = await prisma.admin.findUnique({
      where: { id: admin.id },
    });
    if (!dbAdmin) throw new ApiError("User no longer exists", 401);
    c.set("admin", admin);
    await next();
  } catch (error) {
    if (
      (error as Error).name === "JWTExpired" ||
      (error as Error).name === "JWSSignatureVerificationFailed"
    )
      return c.json({ message: "Unauthorized" }, 401);
    if (isDev) console.error("Server error:", error);
    if (error instanceof ZodError) return c.json({ message: "Forbidden" }, 403);
    if (error instanceof ApiError)
      return c.json(
        { message: error.message },
        error.code as ContentfulStatusCode,
      );
    if (error instanceof Error) return c.json({ message: error.message }, 400);
    return c.json({ message: "An unknown error occurred." }, 500);
  }
});
