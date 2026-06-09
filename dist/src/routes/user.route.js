import { Hono } from "hono";
import { GetUsers } from "../services/user.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
const User = new Hono();
User.use(AuthMiddleware);
User.get("/", GetUsers);
export default User;
