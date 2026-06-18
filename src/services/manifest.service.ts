import type { Context } from "hono";
import { prisma } from "../lib/database.js";
import { ManifestSchema } from "../lib/zod.js";
import { ApiError } from "../lib/errorHandler.js";

export const GetManifests = async (c: Context) => {
  const manifests = await prisma.manifest.findMany();
  return c.json(manifests);
};

export const GetActiveManifest = async (c: Context) => {
  const manifest = await prisma.manifest.findFirst({
    where: { active: true },
  });
  if (!manifest) throw new ApiError("No active manifest", 404);
  return c.json({
    id: manifest.id,
    version: manifest.version,
    releaseNotes: manifest.name,
    downloadUrl: manifest.url,
    releaseDate: manifest.datetime,
  });
};

export const NewManifest = async (c: Context) => {
  const data = ManifestSchema.omit({ id: true }).parse(await c.req.json());
  const manifest = await prisma.manifest.create({ data });
  return c.json(manifest);
};

export const ActivateManifest = async (c: Context) => {
  const id = c.req.param("id");
  const manifest = await prisma.$transaction(async (tx) => {
    await tx.manifest.updateMany({
      where: { NOT: { id } },
      data: { active: false },
    });
    const manifest = await tx.manifest.update({
      where: { id },
      data: { active: true },
    });
    return manifest;
  });
  return c.json(manifest);
};

export const DeleteManifest = async (c: Context) => {
  const id = c.req.param("id");
  await prisma.manifest.delete({ where: { id } });
  return c.json({ message: "Manifest deleted" });
};
