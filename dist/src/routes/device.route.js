import { Hono } from "hono";
import { GetDevice, Heartbeat, ListDevices, RegisterDevice, SetDeviceStatus, } from "../services/device.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { DeviceMiddleware } from "../middleware/device.middleware.js";
const Device = new Hono();
// Open: a machine with no credentials cannot authenticate to ask for some.
Device.post("/register", RegisterDevice);
// Device-authenticated.
Device.post("/heartbeat", DeviceMiddleware, Heartbeat);
// Admin-authenticated, for the Control Centre.
Device.use("/manage/*", AuthMiddleware);
Device.get("/manage", ListDevices);
Device.get("/manage/:id", GetDevice);
Device.patch("/manage/:id/status", SetDeviceStatus);
export default Device;
