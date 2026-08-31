import { Hono } from "hono";
import {
  DeletePractice,
  GetPractices,
  NewPractice,
  UpdatePractice,
  BulkImportPractice,
} from "../services/practice.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const Practice = new Hono();

Practice.get("/", GetPractices);

Practice.use(AuthMiddleware);

Practice.post("/", NewPractice);

Practice.post("/bulk-import", BulkImportPractice);

Practice.patch("/:id", UpdatePractice);

Practice.delete("/:id", DeletePractice);

export default Practice;
