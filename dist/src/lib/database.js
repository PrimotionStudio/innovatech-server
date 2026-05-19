import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
const connectionString = process.env.DATABASE_URL;
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
        transactionOptions: { timeout: 15000 },
    });
globalForPrisma.prisma = prisma;
const toPrismaInclude = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === true) {
            result[key] = true;
        }
        else {
            result[key] = {
                include: toPrismaInclude(value),
            };
        }
    }
    return result;
};
export const getIncludeParams = (c) => {
    const query = c.req.query();
    const include = query.include;
    if (!include)
        return undefined;
    const includeFields = include
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    if (includeFields.length === 0)
        return undefined;
    const result = {};
    for (const field of includeFields) {
        const parts = field.split(".");
        let current = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                if (current[part] === undefined) {
                    current[part] = true;
                }
            }
            else {
                if (current[part] === undefined || current[part] === true) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }
    return toPrismaInclude(result);
};
export const getWhereParams = (c) => {
    const query = c.req.query();
    const whereParam = query.where;
    const searchParam = query.search;
    let whereConditions;
    if (whereParam) {
        try {
            whereConditions = JSON.parse(whereParam);
        }
        catch {
            whereConditions = undefined;
        }
    }
    if (searchParam) {
        const searchableFields = whereConditions
            ? Object.keys(whereConditions).filter((key) => typeof whereConditions[key] === "string")
            : [];
        const searchConditions = searchableFields.length > 0
            ? searchableFields.map((field) => ({
                [field]: {
                    contains: searchParam,
                    mode: "insensitive",
                },
            }))
            : undefined;
        if (searchConditions) {
            whereConditions = {
                ...whereConditions,
                AND: [...(whereConditions?.AND ?? []), { OR: searchConditions }],
            };
        }
    }
    return whereConditions;
};
