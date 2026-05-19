import { Hono } from "hono";
import { RegisterAdmin, UserLogin } from "../services/auth.service.js";

const Auth = new Hono();

Auth.post("/login", UserLogin);

Auth.post("/register", RegisterAdmin);

export default Auth;
