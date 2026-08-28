import { createMiddleware } from "hono/factory";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/database.js";
/**
 * Authenticates a Kotlead Desktop installation.
 *
 * Two headers: the public device id and the secret handed back once at
 * registration. The id alone is deliberately not enough. It shows up in the
 * Control Centre, in logs and in support conversations, so treating it as a
 * credential would mean anyone who ever saw one could impersonate that machine
 * and pull whatever content it was assigned.
 *
 * The secret is compared against a bcrypt hash, which costs real time on every
 * request. That is acceptable here because devices poll on the order of minutes,
 * not seconds. If sync ever becomes chatty, issue a short-lived token at the
 * start of a sync run rather than weakening this.
 */
export const DEVICE_ID_HEADER = "x-device-id";
export const DEVICE_SECRET_HEADER = "x-device-secret";
export const DeviceMiddleware = createMiddleware(async (c, next) => {
    const deviceId = c.req.header(DEVICE_ID_HEADER);
    const secret = c.req.header(DEVICE_SECRET_HEADER);
    if (!deviceId || !secret) {
        return c.json({ message: "Device credentials required" }, 401);
    }
    const device = await prisma.device.findUnique({ where: { deviceId } });
    // Same answer for "no such device" and "wrong secret". Distinguishing them
    // would turn this endpoint into a way to enumerate valid device ids.
    if (!device || !(await bcrypt.compare(secret, device.secretHash))) {
        return c.json({ message: "Device credentials rejected" }, 401);
    }
    if (device.status !== "ACTIVE") {
        // Distinct from a credential failure, because this one is worth showing a
        // human: the machine is known, an administrator turned it off.
        return c.json({ message: `This device is ${device.status.toLowerCase()}` }, 403);
    }
    // Last seen is the backbone of the online/offline counts in the Control
    // Centre, and every authenticated call is evidence the machine is alive, so
    // it is recorded here rather than only on sync.
    await prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
    });
    c.set("device", { id: device.id, deviceId: device.deviceId });
    await next();
});
