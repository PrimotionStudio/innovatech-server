import type { Context } from "hono";
import { prisma } from "../lib/database.js";

export const GetUsers = async (c: Context) => {
  const users = await prisma.user.findMany();
  return c.json(users);
};
