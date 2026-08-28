import { Hono } from "hono";
import { GetInsightsSummary } from "../services/activity.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
const Insights = new Hono();
// Fleet-wide usage is the Control Centre talking, so it is admin-authenticated
// rather than device-authenticated.
Insights.use("*", AuthMiddleware);
Insights.get("/summary", GetInsightsSummary);
export default Insights;
