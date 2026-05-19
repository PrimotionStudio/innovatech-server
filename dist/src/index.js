import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ZodError } from "zod";
import { rateLimiter } from "hono-rate-limiter";
import { ApiError } from "./lib/errorHandler.js";
import { Prisma } from "./generated/prisma/client.js";
import { serve } from "@hono/node-server";
const app = new Hono({ strict: false }).basePath("/api/v1");
const isDev = process.env.NODE_ENV !== "production";
app.use(poweredBy({ serverName: "Innovatech" }));
if (isDev)
    app.use(logger());
app.use(trimTrailingSlash());
app.use(rateLimiter({
    windowMs: 60 * 1000,
    limit: 100,
    keyGenerator: (c) => c.req.header("authorization") || "anonymous",
}));
app.use("*", cors({
    origin: [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    maxAge: 600,
    credentials: true,
}));
app.get("/", (c) => c.json({ message: "Hello Innovatech!" }));
app.onError((error, c) => {
    if (error instanceof ApiError)
        return c.json({ message: error.message }, 400);
    // Sentry.captureException(error);
    if (isDev)
        console.error("Server error:", error);
    if (error instanceof ZodError)
        return c.json({ message: error.issues[0].message }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return c.json({ message: "This record already exists." }, 409);
            case "P2025":
            case "P2001":
                return c.json({ message: "Resource not found." }, 404);
            case "P2003":
                return c.json({ message: "Invalid reference. Related record does not exist." }, 400);
            case "P2011":
            case "P2012":
                return c.json({ message: "Missing required data." }, 400);
            default:
                return c.json({ message: "Database request failed." }, 400);
        }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return c.json({ message: "Invalid data sent to database." }, 400);
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return c.json({ message: "Database connection failed." }, 500);
    }
    if (error instanceof Error)
        return c.json({ message: error.message }, 400);
    return c.json({ message: "An unknown error occurred." }, 500);
});
serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 9999,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
export default app;
