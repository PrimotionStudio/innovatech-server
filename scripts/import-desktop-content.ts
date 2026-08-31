/**
 * One-time import of the desktop app's hardcoded content into Neon.
 *
 * Run with:
 *   npx tsx scripts/import-desktop-content.ts --sqlite "C:\\path\\to\\app.db"
 *   npx tsx scripts/import-desktop-content.ts --sqlite "..." --apply
 *
 * Nothing is written without `--apply`. The default is a dry run that prints
 * exactly what it would do, because this points at the live database and the
 * cost of finding out afterwards is high.
 *
 * # Why it reads SQLite rather than the Rust source
 *
 * The content lives in `src-tauri/src/seeds/`, which is about 6,900 lines of
 * Rust literals, `practice.rs` alone being 6,522 of them. Parsing that would
 * mean writing a Rust literal parser that breaks the first time somebody
 * reformats a string, and it would silently drop anything it failed to
 * understand.
 *
 * The seeds already run on first launch and write into the app's local SQLite
 * database. Reading that database gets the same data after the app itself has
 * interpreted it, which removes a whole class of transcription error. So the
 * input is a copy of `app.db` from a machine that has opened the app once:
 *
 *   %APPDATA%\com.innovatech.desktop\app.db
 *
 * # Idempotent
 *
 * Courses match on name, lessons on (course, title), practices on
 * (course, title). Running it twice updates rather than duplicates, so a failed
 * run can simply be repeated.
 *
 * # Imported unpublished, deliberately
 *
 * # Practices and the courses they point at
 *
 * 62 of the 64 practices reference local course ids that have no row in the
 * desktop `course` table at all: `ts_mathematics_0` through `ts_geography_10`,
 * and `csv_1` through `csv_20`. Only 4 real courses exist. Left alone, every
 * one of those practices would import with `courseId: null` and the subject
 * grouping would be gone, which is a quiet loss of structure rather than a
 * visible failure.
 *
 * The `ts_` family carries its subject twice: in the id, and again as the title
 * prefix (`ts_mathematics_4` is titled "Mathematics - Geometry & Shapes").
 * Where those two agree, the subject is read from the data rather than guessed,
 * and a course is created for it.
 *
 * The `csv_` family carries no such signal. The titles are standalone topics
 * with no shared prefix, so there is nothing to derive a name from and the
 * script refuses to invent one. Those stay unattached and are reported as a
 * group; `--ungrouped-course "Name"` attaches them to a course of that name if
 * somebody decides what it should be.
 *
 * # Imported unpublished, deliberately
 *
 * Every course lands with `published: false` and `autoDownload: false`.
 * Importing them as live would push the entire back catalogue to every
 * installation in the field the moment this runs. Publishing is a decision
 * somebody makes per course, in the Control Centre, with the distribution
 * dialog that exists for it.
 */

import { DatabaseSync } from "node:sqlite";
import { parseArgs } from "node:util";
// Reuses the app's own client, so the Neon connection string comes from .env
// through exactly the same path the server uses. No second place to configure,
// and no chance of pointing this at the wrong database by accident.
import { prisma } from "../src/lib/database.js";

type Row = Record<string, unknown>;

const { values } = parseArgs({
  options: {
    sqlite: { type: "string" },
    apply: { type: "boolean", default: false },
    "ungrouped-course": { type: "string" },
  },
});

if (!values.sqlite) {
  console.error(
    "Missing --sqlite. Point it at a copy of app.db from a machine that has\n" +
      "opened the desktop app at least once, normally:\n" +
      "  %APPDATA%\\com.innovatech.desktop\\app.db",
  );
  process.exit(1);
}

const apply = values.apply === true;

/** Anything that did not map cleanly, reported at the end rather than dropped. */
const unmapped: string[] = [];

function readAll(db: DatabaseSync, table: string): Row[] {
  try {
    return db.prepare(`SELECT * FROM ${table}`).all() as Row[];
  } catch (e) {
    unmapped.push(`table "${table}" could not be read: ${(e as Error).message}`);
    return [];
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

/** Lowercased letters and digits only, so " & ", "(", "-" and case stop mattering. */
const squash = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The subject a practice belongs to, or null when the data does not say.
 *
 * Two independent signals have to agree: the slug inside a `ts_<slug>_<n>`
 * local course id, and the prefix before " - " in the title. Requiring both is
 * what makes this reading the data rather than guessing at it, and it is why
 * the `csv_` family correctly comes back null instead of being forced into some
 * invented bucket.
 *
 * The title supplies the name, because it is the form written for a person:
 * "English Language & Literature" rather than "english".
 */
function subjectFor(localCourseId: string, title: string): string | null {
  const id = /^ts_([a-z0-9]+)_\d+$/.exec(localCourseId);
  if (!id) return null;

  const separator = title.indexOf(" - ");
  if (separator === -1) return null;

  const subject = title.slice(0, separator).trim();
  if (!subject) return null;

  return squash(subject).startsWith(squash(id[1]!)) ? subject : null;
}

async function main() {
  console.log(`Reading ${values.sqlite}`);
  console.log(apply ? "MODE: apply, writes are real\n" : "MODE: dry run, nothing will be written\n");

  const db = new DatabaseSync(values.sqlite!, { readOnly: true });

  const courses = readAll(db, "course");
  const lessons = readAll(db, "lesson");
  const practices = readAll(db, "practice");

  console.log(
    `Found ${courses.length} courses, ${lessons.length} lessons, ${practices.length} practices\n`,
  );

  // The desktop uses integer primary keys; the server uses uuids. This maps one
  // to the other as courses are created, so lessons and practices can be
  // attached to the right row.
  const courseIdByLocalId = new Map<string, string>();

  for (const row of courses) {
    const name = str(row.name);
    if (!name) {
      unmapped.push(`a course with local id ${str(row.id)} has no name, skipped`);
      continue;
    }

    const data = {
      name,
      description: str(row.description),
      imageUrl: str(row.image_url),
    };

    const existing = await prisma.course.findFirst({ where: { name } });

    if (apply) {
      const saved = existing
        ? await prisma.course.update({ where: { id: existing.id }, data })
        : await prisma.course.create({
            // Unpublished on purpose. See the note at the top of this file.
            data: { ...data, category: "ACADEMIC", published: false, autoDownload: false },
          });
      courseIdByLocalId.set(str(row.id), saved.id);
    } else {
      courseIdByLocalId.set(str(row.id), existing?.id ?? `(new) ${name}`);
    }

    console.log(`${existing ? "update" : "create"} course  ${name}`);
  }

  for (const row of lessons) {
    const localCourseId = str(row.course_id);
    const courseId = courseIdByLocalId.get(localCourseId);
    const title = str(row.title);

    if (!courseId) {
      unmapped.push(
        `lesson "${title}" points at local course ${localCourseId}, which was not imported`,
      );
      continue;
    }

    // The desktop lesson table has no size, and its hash column was added
    // later so older rows carry an empty string. Both are required on the
    // server, so they come across empty and are reported rather than invented.
    const videoHash = str(row.video_hash);
    if (!videoHash) {
      unmapped.push(`lesson "${title}" has no video hash, imported without one`);
    }

    const data = {
      title,
      summary: str(row.summary),
      content: str(row.content),
      videoUrl: str(row.video_url),
      videoSize: "",
      videoHash,
    };

    if (apply) {
      const existing = await prisma.lesson.findFirst({ where: { courseId, title } });
      if (existing) {
        await prisma.lesson.update({ where: { id: existing.id }, data });
      } else {
        await prisma.lesson.create({ data: { ...data, courseId } });
      }
    }
    console.log(`        lesson  ${title}`);
  }

  // Practices first need somewhere to live. Every subject the data actually
  // names gets a course, created once here rather than inside the loop, so 11
  // Mathematics practices produce one course and not eleven.
  const courseIdBySubject = new Map<string, string>();
  const subjects = new Set<string>();
  for (const row of practices) {
    const subject = subjectFor(str(row.course_id), str(row.title));
    if (subject) subjects.add(subject);
  }

  for (const subject of [...subjects].sort()) {
    const existing = await prisma.course.findFirst({ where: { name: subject } });
    if (apply) {
      const saved =
        existing ??
        (await prisma.course.create({
          data: {
            name: subject,
            description: `${subject} practice questions.`,
            imageUrl: "",
            category: "ACADEMIC",
            published: false,
            autoDownload: false,
          },
        }));
      courseIdBySubject.set(subject, saved.id);
    } else {
      courseIdBySubject.set(subject, existing?.id ?? `(new) ${subject}`);
    }
    console.log(`${existing ? "reuse " : "create"} course  ${subject}  (from practice subjects)`);
  }

  // Named on the command line or not at all. See the note at the top: there is
  // nothing in the csv_ rows to derive a name from, so this is the one place a
  // human decision is required rather than inferred.
  const ungroupedName = values["ungrouped-course"]?.trim();
  let ungroupedCourseId: string | null = null;
  if (ungroupedName) {
    const existing = await prisma.course.findFirst({ where: { name: ungroupedName } });
    if (apply) {
      const saved =
        existing ??
        (await prisma.course.create({
          data: {
            name: ungroupedName,
            description: "",
            imageUrl: "",
            category: "ACADEMIC",
            published: false,
            autoDownload: false,
          },
        }));
      ungroupedCourseId = saved.id;
    } else {
      ungroupedCourseId = existing?.id ?? `(new) ${ungroupedName}`;
    }
    console.log(`${existing ? "reuse " : "create"} course  ${ungroupedName}  (--ungrouped-course)`);
  }

  console.log("");

  const stillUngrouped = new Set<string>();

  for (const row of practices) {
    const localCourseId = str(row.course_id);
    const title = str(row.title);
    const subject = subjectFor(localCourseId, title);

    // Three sources, in order of how well the data supports them: a real local
    // course, a subject both the id and the title agree on, then whatever the
    // operator named on the command line.
    const courseId =
      courseIdByLocalId.get(localCourseId) ??
      (subject ? courseIdBySubject.get(subject)! : null) ??
      ungroupedCourseId;

    if (localCourseId && !courseId) {
      stillUngrouped.add(localCourseId);
    }

    let questions: unknown;
    try {
      questions = typeof row.questions === "string" ? JSON.parse(row.questions) : row.questions;
    } catch (e) {
      unmapped.push(`practice "${title}" has unreadable questions JSON, skipped`);
      continue;
    }

    const count = Array.isArray(questions) ? questions.length : 0;
    if (count === 0) {
      unmapped.push(`practice "${title}" has no questions, skipped`);
      continue;
    }

    // user_id and date_time exist on the desktop practice table and have no
    // server equivalent. They describe a local attempt rather than the question
    // bank, so they are intentionally not carried over; attempts arrive through
    // the activity sync instead.
    if (apply) {
      const existing = await prisma.practice.findFirst({ where: { title } });
      if (existing) {
        await prisma.practice.update({
          where: { id: existing.id },
          data: { title, questions: questions as never, courseId },
        });
      } else {
        await prisma.practice.create({
          data: { title, questions: questions as never, courseId },
        });
      }
    }
    console.log(`        practice ${title} (${count} questions)`);
  }

  if (stillUngrouped.size > 0) {
    const ids = [...stillUngrouped].sort();
    unmapped.push(
      `${ids.length} local course id(s) had no course and no subject in the data, so ` +
        `their practices imported unattached: ${ids.join(", ")}. ` +
        `Re-run with --ungrouped-course "Some Name" to put them under one course.`,
    );
  }

  db.close();

  console.log("");
  if (unmapped.length === 0) {
    console.log("Everything mapped cleanly.");
  } else {
    console.log(`${unmapped.length} thing(s) did not map cleanly:`);
    for (const line of unmapped) console.log(`  - ${line}`);
  }

  if (!apply) {
    console.log("\nDry run. Nothing was written. Re-run with --apply to commit.");
  } else {
    console.log(
      "\nImported. Every course landed unpublished; publish them from the\n" +
        "Control Centre when you want devices to download them.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
