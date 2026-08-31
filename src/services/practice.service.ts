import type { Context } from "hono";
import { getIncludeParams, prisma } from "../lib/database.js";
import { PracticeBaseSchema, QuestionSchema } from "../lib/zod.js";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = ["Question", "Option A", "Option B", "Option C", "Option D", "Correct"];

const toScalar = (v: unknown): string =>
  typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v).trim();

/**
 * Bulk imports questions from an Excel workbook into a practice, creating the
 * practice by title when it does not yet exist or appending to it when it does.
 *
 * Expected columns: Question, Option A, Option B, Option C, Option D, Correct.
 * The `Correct` column holds the correct option text (as exported by the RSU mock
 * questions feature); a bare letter (A-D) is also accepted and resolved to the
 * matching option text.
 */
export const BulkImportPractice = async (c: Context) => {
  const body = await c.req.parseBody();
  const title =
    typeof body["title"] === "string" ? body["title"].trim() : "";

  if (!title) return c.json({ message: "A practice title is required." }, 400);

  const file = body["file"];
  if (!(file instanceof File)) {
    return c.json({ message: "An Excel file is required." }, 400);
  }
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
    return c.json({ message: "Only .xlsx and .xls files are supported." }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return c.json({ message: "The uploaded workbook has no sheets." }, 400);
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (rawRows.length === 0) {
    return c.json({ message: "The uploaded workbook has no data." }, 400);
  }

  const headerLookup = new Map<string, string>();
  const firstKeys = Object.keys(rawRows[0]);
  for (const key of firstKeys) {
    headerLookup.set(key.trim().toLowerCase(), key);
  }
  const findHeader = (expected: string) => {
    const found = headerLookup.get(expected.toLowerCase());
    return found ?? (Object.keys(rawRows[0]).find((k) => k.trim().toLowerCase() === expected.toLowerCase()) ?? "");
  };
  const col: Record<string, string> = {};
  for (const expected of REQUIRED_HEADERS) {
    col[expected] = findHeader(expected);
  }
  if (REQUIRED_HEADERS.some((h) => !col[h])) {
    return c.json(
      { message: "Missing required columns. Expected: Question, Option A, Option B, Option C, Option D, Correct." },
      400,
    );
  }

  const questions: typeof QuestionSchema._output[] = [];
  const failed: { row: number; question: string; error: string }[] = [];

  rawRows.forEach((record, idx) => {
    const rowNumber = idx + 2;
    const rawQuestion = toScalar(record[col.Question]);
    const options = [
      toScalar(record[col["Option A"]]),
      toScalar(record[col["Option B"]]),
      toScalar(record[col["Option C"]]),
      toScalar(record[col["Option D"]]),
    ];
    const rawCorrect = toScalar(record[col.Correct]);

    if (!rawQuestion && options.every((o) => !o) && !rawCorrect) return;

    if (!rawQuestion) {
      failed.push({ row: rowNumber, question: "", error: "Question text is empty." });
      return;
    }
    if (options.some((o) => !o)) {
      failed.push({ row: rowNumber, question: rawQuestion, error: "All four options must be provided." });
      return;
    }

    let correctAnswer = rawCorrect;
    const letterIndex = ["a", "b", "c", "d"].indexOf(rawCorrect.trim().toLowerCase());
    if (letterIndex !== -1) {
      correctAnswer = options[letterIndex];
    }
    if (!correctAnswer) {
      failed.push({ row: rowNumber, question: rawQuestion, error: "Correct answer is missing." });
      return;
    }

    questions.push({
      question: rawQuestion,
      options,
      correctAnswer,
      explanation: "",
    });
  });

  let practice;
  if (questions.length > 0) {
    const existing = await prisma.practice.findFirst({
      where: { title },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      const merged = Array.isArray(existing.questions) ? [...existing.questions] : [];
      merged.push(...questions);
      practice = await prisma.practice.update({
        where: { id: existing.id },
        data: { questions: merged },
      });
    } else {
      practice = await prisma.practice.create({
        data: { title, courseId: null, questions },
      });
    }
  }

  return c.json({
    title,
    created: questions.length > 0 ? practice : undefined,
    success: questions.length,
    failed,
  });
};

export const GetPractices = async (c: Context) => {
  const practices = await prisma.practice.findMany({
    include: getIncludeParams(c),
  });
  return c.json(practices);
};

export const NewPractice = async (c: Context) => {
  const data = PracticeBaseSchema.omit({ id: true }).parse(await c.req.json());
  const practice = await prisma.practice.create({ data });
  return c.json(practice);
};

export const UpdatePractice = async (c: Context) => {
  const id = c.req.param("id");
  const data = PracticeBaseSchema.omit({ id: true }).parse(await c.req.json());
  const practice = await prisma.practice.update({
    where: { id },
    data,
  });
  return c.json(practice);
};

export const DeletePractice = async (c: Context) => {
  const id = c.req.param("id");
  await prisma.practice.delete({ where: { id } });
  return c.json({ message: "Practice Deleted" });
};
