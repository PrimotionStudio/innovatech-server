import type { Context } from "hono";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/database.js";
import { ApiError } from "../lib/errorHandler.js";
import {
  DeviceRegisterSchema,
  DeviceStatusUpdateSchema,
  DeviceHeartbeatSchema,
} from "../lib/zod.js";

/** How long without contact before a device is counted as offline. */
const ONLINE_WINDOW_MS = 15 * 60 * 1000;

const SECRET_BYTES = 32;
const BCRYPT_ROUNDS = 10;

/**
 * Public device id, shaped `KTL-XXXXXXXX`.
 *
 * Random rather than derived from hardware. Section 14 of the spec asks for a
 * stable id without collecting invasive hardware detail, and a random id stored
 * by the client satisfies that without ever reading a serial number or a MAC
 * address off the machine.
 */
const newDeviceId = () =>
  `KTL-${randomBytes(4).toString("hex").toUpperCase()}`;

/**
 * Register a new installation.
 *
 * Open by design: a fresh machine has no credentials yet, so it cannot
 * authenticate to ask for any. The secret is returned exactly once and only ever
 * stored hashed, so a database leak does not hand over the fleet.
 */
export const RegisterDevice = async (c: Context) => {
  const data = DeviceRegisterSchema.parse(await c.req.json().catch(() => ({})));

  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const device = await prisma.device.create({
    data: {
      deviceId: newDeviceId(),
      secretHash: await bcrypt.hash(secret, BCRYPT_ROUNDS),
      label: data.label,
      platform: data.platform,
      osVersion: data.osVersion,
      appVersion: data.appVersion,
      lastSeenAt: new Date(),
    },
  });

  return c.json(
    {
      deviceId: device.deviceId,
      // The only time this is ever readable. A device that loses it has to
      // register again, which is the correct outcome.
      deviceSecret: secret,
      registeredAt: device.registeredAt,
    },
    201,
  );
};

/**
 * Let a device correct what the server knows about it.
 *
 * Called after an application update so the Control Centre's "outdated devices"
 * count means something.
 */
export const Heartbeat = async (c: Context) => {
  const device = c.get("device");
  const data = DeviceHeartbeatSchema.parse(await c.req.json().catch(() => ({})));

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: {
      appVersion: data.appVersion,
      osVersion: data.osVersion,
      platform: data.platform,
      label: data.label,
      lastSeenAt: new Date(),
    },
  });

  return c.json({ deviceId: updated.deviceId, lastSeenAt: updated.lastSeenAt });
};

/** Administrative listing, with the counts the device dashboard needs. */
export const ListDevices = async (c: Context) => {
  const threshold = new Date(Date.now() - ONLINE_WINDOW_MS);

  const devices = await prisma.device.findMany({
    orderBy: { lastSeenAt: "desc" },
    include: { syncStates: true },
  });

  const shaped = devices.map((device) => {
    const failed = device.syncStates.filter((s) => s.status === "FAILED");
    return {
      id: device.id,
      deviceId: device.deviceId,
      label: device.label,
      platform: device.platform,
      osVersion: device.osVersion,
      appVersion: device.appVersion,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
      registeredAt: device.registeredAt,
      online: !!device.lastSeenAt && device.lastSeenAt > threshold,
      syncFailures: failed.length,
    };
  });

  return c.json({
    devices: shaped,
    summary: {
      total: shaped.length,
      online: shaped.filter((d) => d.online).length,
      offline: shaped.filter((d) => !d.online).length,
      blocked: shaped.filter((d) => d.status === "BLOCKED").length,
      withSyncFailures: shaped.filter((d) => d.syncFailures > 0).length,
    },
  });
};

export const GetDevice = async (c: Context) => {
  const id = c.req.param("id");
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      syncStates: { orderBy: { updatedAt: "desc" } },
      profile: true,
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 50,
        select: { id: true, uid: true, startedAt: true, endedAt: true, durationSeconds: true },
      },
      activity: {
        orderBy: { occurredAt: "desc" },
        take: 100,
        select: {
          id: true,
          uid: true,
          eventType: true,
          entityType: true,
          entityId: true,
          entityName: true,
          occurredAt: true,
          durationSeconds: true,
        },
      },
      practiceAttempts: {
        orderBy: { attemptedAt: "desc" },
        take: 50,
        select: {
          id: true,
          uid: true,
          practiceTitle: true,
          attemptedAt: true,
          correct: true,
          total: true,
          score: true,
        },
      },
    },
  });
  if (!device) throw new ApiError("Device not found", 404);

  // The hash never leaves the server, not even to an authenticated admin.
  const { secretHash, ...safe } = device;
  return c.json({
    ...safe,
    online:
      !!device.lastSeenAt &&
      device.lastSeenAt > new Date(Date.now() - ONLINE_WINDOW_MS),
  });
};

/**
 * Block, retire or reactivate a device.
 *
 * Blocking is reversible and leaves the credentials intact, which is why there
 * is no delete here. Deleting a device would let the same machine register again
 * as a stranger and would lose the record of what it had.
 */
export const SetDeviceStatus = async (c: Context) => {
  const id = c.req.param("id");
  const { status } = DeviceStatusUpdateSchema.parse(await c.req.json());

  const device = await prisma.device.update({ where: { id }, data: { status } });
  return c.json({ id: device.id, deviceId: device.deviceId, status: device.status });
};
