import type { Context } from "hono";
import { getIncludeParams, prisma } from "../lib/database.js";
import {
  CourseBaseSchema,
  CoursePublishSchema,
  LessonBaseSchema,
} from "../lib/zod.js";

export const GetCourses = async (c: Context) => {
  const courses = await prisma.course.findMany({
    include: getIncludeParams(c),
  });
  return c.json(courses);
};

export const GetCourse = async (c: Context) => {
  const id = c.req.param("id");
  const course = await prisma.course.findUnique({
    where: { id },
    include: getIncludeParams(c),
  });
  return c.json(course);
};

export const NewCourse = async (c: Context) => {
  const data = CourseBaseSchema.omit({ id: true }).parse(await c.req.json());
  const course = await prisma.course.create({ data });
  return c.json(course, 201);
};

export const UpdateCourse = async (c: Context) => {
  const id = c.req.param("id");
  const data = CourseBaseSchema.omit({ id: true }).parse(await c.req.json());
  const course = await prisma.course.update({ where: { id }, data });
  return c.json(course);
};

/**
 * Publishing and distribution, kept apart from editing a course.
 *
 * Editing a description and telling the whole fleet to download something are
 * different actions with different blast radii, so they are different endpoints.
 * It also means the existing create and update paths keep working untouched.
 *
 * `bumpVersion` is explicit rather than automatic. An automatic bump on every
 * save would make every typo correction a fleet-wide download, which is exactly
 * the "download everything every time" behaviour the sync design exists to
 * avoid.
 */
export const PublishCourse = async (c: Context) => {
  const id = c.req.param("id");
  const data = CoursePublishSchema.parse(await c.req.json());

  const course = await prisma.course.update({
    where: { id },
    data: {
      category: data.category,
      published: data.published,
      autoDownload: data.autoDownload,
      ...(data.bumpVersion ? { version: { increment: 1 } } : {}),
    },
  });

  return c.json(course);
};

export const DeleteCourse = async (c: Context) => {
  const id = c.req.param("id");
  await prisma.course.delete({ where: { id } });
  return c.json({ message: "Course deleted" });
};

export const GetLessonsByCourseId = async (c: Context) => {
  const id = c.req.param("id");
  const lessons = await prisma.lesson.findMany({
    where: { courseId: id },
    include: getIncludeParams(c),
  });
  return c.json(lessons);
};

export const NewLesson = async (c: Context) => {
  const data = LessonBaseSchema.omit({ id: true }).parse(await c.req.json());
  const lesson = await prisma.lesson.create({ data });
  return c.json(lesson, 201);
};

export const UpdateLesson = async (c: Context) => {
  const id = c.req.param("id");
  const data = LessonBaseSchema.omit({ id: true }).parse(await c.req.json());
  const lesson = await prisma.lesson.update({ where: { id }, data });
  return c.json(lesson);
};

export const DeleteLesson = async (c: Context) => {
  const id = c.req.param("id");
  await prisma.lesson.delete({ where: { id } });
  return c.json({ message: "Lesson deleted" });
};
