import { Hono } from "hono";
import { GetSyncManifest, ReportSyncState } from "../services/sync.service.js";
import { DeviceMiddleware } from "../middleware/device.middleware.js";

const Sync = new Hono();

// Every route here speaks for one specific device, so all of them are
// device-authenticated rather than open.
Sync.use("*", DeviceMiddleware);

Sync.get("/manifest", GetSyncManifest);
Sync.post("/report", ReportSyncState);

export default Sync;
