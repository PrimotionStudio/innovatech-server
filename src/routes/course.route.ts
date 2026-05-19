import { Hono } from "hono";
import {
  DeleteCourse,
  DeleteLesson,
  GetCourse,
  GetCourses,
  GetLessonsByCourseId,
  NewCourse,
  NewLesson,
  UpdateCourse,
  UpdateLesson,
} from "../services/course.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const Course = new Hono();

Course.use(AuthMiddleware);

Course.get("/", GetCourses);

Course.get("/:id", GetCourse);

Course.post("/", NewCourse);

Course.patch("/:id", UpdateCourse);

Course.delete("/:id", DeleteCourse);

Course.get("/:id/lessons", GetLessonsByCourseId);

Course.post("/:id/lessons", NewLesson);

Course.patch("/:id/lessons", UpdateLesson);

Course.delete("/:id/lessons", DeleteLesson);

export default Course;
