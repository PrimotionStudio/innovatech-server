import { Hono } from "hono";
import {
  GetCourseContent,
  GetSyncManifest,
  ReportSyncState,
} from "../services/sync.service.js";
import { ReportActivity } from "../services/activity.service.js";
import { DeviceMiddleware } from "../middleware/device.middleware.js";

const Sync = new Hono();

// Every route here speaks for one specific device, so all of them are
// device-authenticated rather than open.
Sync.use("*", DeviceMiddleware);

Sync.get("/manifest", GetSyncManifest);
Sync.get("/courses/:id", GetCourseContent);
Sync.post("/report", ReportSyncState);
Sync.post("/activity", ReportActivity);

export default Sync;
