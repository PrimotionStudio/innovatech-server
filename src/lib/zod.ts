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
  active: z.boolean().default(false),
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

/**
 * Everything a device may tell us about itself.
 *
 * All optional, and deliberately shallow. Section 14 asks for a stable identity
 * without collecting invasive hardware detail, so there is no serial number, no
 * MAC address and no user name here. This is enough to tell two school laptops
 * apart and to answer "is this one out of date".
 */
export const DeviceRegisterSchema = z.object({
  label: z.string().max(120).optional(),
  platform: z.string().max(60).optional(),
  osVersion: z.string().max(60).optional(),
  appVersion: z.string().max(40).optional(),
});
export type DeviceRegisterType = z.infer<typeof DeviceRegisterSchema>;

export const DeviceHeartbeatSchema = DeviceRegisterSchema;
export type DeviceHeartbeatType = z.infer<typeof DeviceHeartbeatSchema>;

export const DeviceStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "RETIRED"]),
});
export type DeviceStatusUpdateType = z.infer<typeof DeviceStatusUpdateSchema>;

/**
 * What a device reports after a sync run.
 *
 * `FAILED` carries a message so the Control Centre can show why a device is
 * behind, not merely that it is.
 */
export const SyncEntrySchema = z.object({
  resourceType: z.string().min(1).max(30),
  resourceId: z.string().min(1).max(120),
  installedVersion: z.number().int().min(0),
  status: z.enum(["OK", "PENDING", "FAILED"]).default("OK"),
  message: z.string().max(500).optional(),
});

export const SyncReportSchema = z.object({
  entries: z.array(SyncEntrySchema).min(1).max(500),
});
export type SyncReportType = z.infer<typeof SyncReportSchema>;

/**
 * Content-management fields on a course.
 *
 * Separate from `CourseBaseSchema` so the existing create and update endpoints
 * keep working untouched. Publishing and distribution are a different action
 * from editing a description, and the spec is explicit about not breaking what
 * already works.
 */
export const CoursePublishSchema = z.object({
  category: z.enum(["DIGITAL", "ACADEMIC"]).optional(),
  published: z.boolean().optional(),
  autoDownload: z.boolean().optional(),
  /// Omit to leave the version alone; send true to bump it and tell every device
  /// there is something new to fetch.
  bumpVersion: z.boolean().optional(),
});
export type CoursePublishType = z.infer<typeof CoursePublishSchema>;
