import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/database.js";

const ADMIN_EMAIL = "admin@innovatech.com";
const ADMIN_PASSWORD = "password";


async function main() {
  console.log("Seeding database...");

  // Clean existing data in reverse dependency order
  await prisma.practice.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.manifest.deleteMany();
  await prisma.admin.deleteMany();

  // Seed Admin
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  await prisma.admin.create({
    data: {
      name: "System Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
    },
  });
  console.log("  ✓ Admin seeded");

  // Seed Users
  // await prisma.user.createMany({
  //   data: USERS.map((u) => ({
  //     name: u.name,
  //     class: u.class,
  //     school: u.school,
  //     guardianName: u.guardianName,
  //     guardianEmail: u.guardianEmail,
  //     guardianPhone: u.guardianPhone,
  //   })),
  // });
  // console.log("  ✓ Users seeded");

  // Seed Manifest
  // await prisma.manifest.create({
  //   data: {
  //     name: "Innovatech App v1.0.0",
  //     version: "1.0.0",
  //     hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  //     url: "https://releases.innovatech.com/v1.0.0/innovatech.apk",
  //     appSize: "45.8 MB",
  //     innovaiModelTagName: "innovai-v1.0",
  //     innovaiModelSize: "256 MB",
  //     innovaiModelHash: "sha256-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  //     active: true,
  //   },
  // });
  // console.log("  ✓ Manifest seeded");

  // Seed Courses, Lessons, Practices
  // for (const courseData of COURSES) {
  //   const { lessons, practice, ...courseFields } = courseData;

  //   const course = await prisma.course.create({
  //     data: courseFields,
  //   });

  //   await prisma.lesson.createMany({
  //     data: lessons.map((l) => ({
  //       courseId: course.id,
  //       title: l.title,
  //       summary: l.summary,
  //       content: l.content,
  //       videoUrl: l.videoUrl,
  //       videoSize: l.videoSize,
  //       videoHash: l.videoHash,
  //     })),
  //   });

  //   await prisma.practice.create({
  //     data: {
  //       courseId: course.id,
  //       title: practice.title,
  //       questions: practice.questions,
  //     },
  //   });

  //   console.log(`  ✓ Course "${course.name}" seeded with ${lessons.length} lessons and 1 practice`);
  // }

  console.log("\nSeeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
