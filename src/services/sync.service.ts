import type { Context } from "hono";
import { prisma } from "../lib/database.js";
import { SyncReportSchema } from "../lib/zod.js";

/**
 * The synchronisation manifest, and what devices report back.
 *
 * # Why this is not the existing `Manifest` model
 *
 * The `Manifest` table is the **application release** record: one active row
 * describing the installer and the Ollama model the desktop app should be
 * running. That is a different question from "what content should this device
 * have", and conflating them would mean bumping an app release every time a
 * course changed.
 *
 * So the app release is one field inside the sync manifest rather than the whole
 * of it, and the manifest itself is computed per device rather than stored.
 *
 * # Why computed rather than stored
 *
 * A stored manifest is a cache that has to be invalidated every time a course is
 * published, unpublished, versioned or has auto-download toggled. Getting that
 * wrong means a device that never learns about an update, which is invisible
 * until somebody complains. Deriving it from the content tables on each request
 * cannot drift.
 *
 * # Incremental by construction
 *
 * The manifest carries versions, not content. The device compares them against
 * what it has and downloads only the difference. This is the whole reason
 * `Course`, `Lesson` and `Practice` carry a `version`.
 */

/** Resource kinds a device can report progress against. */
const RESOURCE_TYPES = ["course", "cbt", "model", "app"] as const;

export const GetSyncManifest = async (c: Context) => {
  const device = c.get("device");

  const [activeRelease, courses, practices, installed] = await Promise.all([
    prisma.manifest.findFirst({ where: { active: true } }),
    // Only published courses, and only those marked for automatic distribution.
    // An unpublished course is invisible to every device, which is what lets a
    // content manager build one up over several sittings.
    prisma.course.findMany({
      where: { published: true, autoDownload: true },
      select: {
        id: true,
        name: true,
        category: true,
        version: true,
        updatedAt: true,
        lessons: {
          select: {
            id: true,
            version: true,
            videoUrl: true,
            videoSize: true,
            videoHash: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.practice.findMany({
      select: { id: true, version: true },
    }),
    prisma.deviceSyncState.findMany({ where: { deviceId: device.id } }),
  ]);

  const installedVersion = (resourceType: string, resourceId: string) =>
    installed.find(
      (s) => s.resourceType === resourceType && s.resourceId === resourceId,
    )?.installedVersion ?? null;

  return c.json({
    generatedAt: new Date().toISOString(),
    device: { deviceId: device.deviceId },

    /// Application updates travel through GitHub Releases, not through content
    /// sync. This is here so a device can tell it is behind without a second
    /// round trip, not so it can download from us.
    app: activeRelease
      ? {
          version: activeRelease.version,
          url: activeRelease.url,
          hash: activeRelease.hash,
          size: activeRelease.appSize,
        }
      : null,

    aiModel: activeRelease
      ? {
          tag: activeRelease.innovaiModelTagName,
          size: activeRelease.innovaiModelSize,
          hash: activeRelease.innovaiModelHash,
        }
      : null,

    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      category: course.category,
      version: course.version,
      installedVersion: installedVersion("course", course.id),
      updatedAt: course.updatedAt,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        version: lesson.version,
        videoUrl: lesson.videoUrl,
        videoSize: lesson.videoSize,
        videoHash: lesson.videoHash,
      })),
    })),

    /// CBT is versioned as a set. The desktop app practises offline against a
    /// whole bank, so a per-question version would buy nothing.
    cbt: {
      version: practices.reduce((max, p) => Math.max(max, p.version), 0),
      count: practices.length,
      installedVersion: installedVersion("cbt", "all"),
    },
  });
};

/**
 * A device reporting what it managed to install.
 *
 * Accepts failures as first-class. A device that could not finish a download
 * says so and why, and that surfaces in the Control Centre rather than the
 * device silently appearing up to date.
 */
export const ReportSyncState = async (c: Context) => {
  const device = c.get("device");
  const { entries } = SyncReportSchema.parse(await c.req.json());

  const rejected = entries.filter(
    (e) => !RESOURCE_TYPES.includes(e.resourceType as never),
  );
  if (rejected.length > 0) {
    return c.json(
      {
        message: `Unknown resource type: ${rejected[0]!.resourceType}`,
      },
      400,
    );
  }

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.deviceSyncState.upsert({
        where: {
          deviceId_resourceType_resourceId: {
            deviceId: device.id,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
          },
        },
        create: {
          deviceId: device.id,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          installedVersion: entry.installedVersion,
          status: entry.status,
          message: entry.message,
        },
        update: {
          installedVersion: entry.installedVersion,
          status: entry.status,
          message: entry.message,
        },
      }),
    ),
  );

  return c.json({ accepted: entries.length });
};
