import { Hono } from "hono";
import { GetMe, RegisterAdmin, UserLogin } from "../services/auth.service.js";

const Auth = new Hono();

Auth.post("/login", UserLogin);

Auth.post("/register", RegisterAdmin);

Auth.get("/me", GetMe);

export default Auth;
