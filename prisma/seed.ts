import "dotenv/config";

import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.student.count();
  if (count > 0) {
    console.log("The database already contains students; seed data was left unchanged.");
    return;
  }

  const students = await Promise.all(
    [
      ["S-101", "Alice Johnson", "A"],
      ["S-102", "Brian Lee", "A"],
      ["S-103", "Chloe Smith", "B"],
      ["S-104", "David Brown", "B"],
      ["S-105", "Emma Davis", "A"],
    ].map(([rollNo, name, section]) =>
      prisma.student.create({ data: { rollNo, name, section } }),
    ),
  );

  const subjects = await Promise.all(
    ["Mathematics", "Science", "English", "History"].map((subjectName) =>
      prisma.subject.create({
        data: { subjectName, maxMarks: 100, passMarks: 40 },
      }),
    ),
  );

  const scores = [
    [88, 92, 76, 82],
    [70, 55, 61, 68],
    [60, 48, 44, 51],
    [40, 35, 52, 47],
    [95, 90, 88, 91],
  ];

  await prisma.mark.createMany({
    data: scores.flatMap((studentScores, studentIndex) =>
      studentScores.map((marksObtained, subjectIndex) => ({
        studentId: students[studentIndex].id,
        subjectId: subjects[subjectIndex].id,
        assessment: "Unit Test 1",
        marksObtained,
      })),
    ),
  });
}

main()
  .then(() => console.log("Prisma seed completed."))
  .catch((error: unknown) => {
    console.error("Prisma seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
