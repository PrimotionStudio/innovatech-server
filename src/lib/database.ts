import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Context } from "hono";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    transactionOptions: { timeout: 15000 },
  });

globalForPrisma.prisma = prisma;

const toPrismaInclude = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === true) {
      result[key] = true;
    } else {
      result[key] = {
        include: toPrismaInclude(value as Record<string, unknown>),
      };
    }
  }
  return result;
};

export const getIncludeParams = (c: Context) => {
  const query = c.req.query();
  const include = query.include;
  if (!include) return undefined;
  const includeFields = include
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  if (includeFields.length === 0) return undefined;
  const result: Record<string, unknown> = {};
  for (const field of includeFields) {
    const parts = field.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        if (current[part] === undefined) {
          current[part] = true;
        }
      } else {
        if (current[part] === undefined || current[part] === true) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  }
  return toPrismaInclude(result);
};

export const getWhereParams = (c: Context) => {
  const query = c.req.query();
  const whereParam = query.where;
  const searchParam = query.search;
  let whereConditions: Record<string, any> | undefined;
  if (whereParam) {
    try {
      whereConditions = JSON.parse(whereParam);
    } catch {
      whereConditions = undefined;
    }
  }
  if (searchParam) {
    const searchableFields = whereConditions
      ? Object.keys(whereConditions).filter(
          (key) => typeof whereConditions![key] === "string",
        )
      : [];
    const searchConditions =
      searchableFields.length > 0
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
