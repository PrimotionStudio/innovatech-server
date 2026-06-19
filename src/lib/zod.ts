import { z } from "zod";

export const AdminSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
});
export type AdminType = z.infer<typeof AdminSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.string(),
  school: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string(),
  datetime: z.coerce.date(),
});
export type UserType = z.infer<typeof UserSchema>;

export const ManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  hash: z.string(),
  url: z.string(),
  appSize: z.coerce.string(),
  innovaiModelTagName: z.string(),
  innovaiModelSize: z.coerce.string(),
  innovaiModelHash: z.string(),
  active: z.boolean(),
  datetime: z.coerce.date(),
});
export type ManifestType = z.infer<typeof ManifestSchema>;

export const CourseBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
});
export type CourseBaseType = z.infer<typeof CourseBaseSchema>;

export const LessonBaseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  videoUrl: z.string(),
  videoSize: z.string(),
  videoHash: z.string(),
});
export type LessonBaseType = z.infer<typeof LessonBaseSchema>;

export const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const PracticeBaseSchema = z.object({
  id: z.string(),
  courseId: z.string().optional(),
  title: z.string(),
  questions: z.array(QuestionSchema),
});
export type PracticeBaseType = z.infer<typeof PracticeBaseSchema>;

export type CourseType = CourseBaseType & {
  lessons: LessonType[];
  practices: PracticeType[];
};

export type LessonType = LessonBaseType & {
  course?: CourseType;
};

export type PracticeType = PracticeBaseType & {
  course?: CourseType;
};

export const CourseSchema: z.ZodType<CourseType> = CourseBaseSchema.extend({
  lessons: z.array(z.lazy(() => LessonSchema)),
  practices: z.array(z.lazy(() => PracticeSchema)),
});

export const LessonSchema: z.ZodType<LessonType> = LessonBaseSchema.extend({
  course: z.lazy(() => CourseSchema),
});

export const PracticeSchema: z.ZodType<PracticeType> = PracticeBaseSchema.extend({
  course: z.lazy(() => CourseSchema),
});
