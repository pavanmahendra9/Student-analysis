import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const studentId = Number(data.studentId);
  const subjectId = Number(data.subjectId);
  const assessment = typeof data.assessment === "string" ? data.assessment.trim() : "";
  const marksObtained = Number(data.marksObtained);

  if (
    !Number.isSafeInteger(studentId) ||
    studentId < 1 ||
    !Number.isSafeInteger(subjectId) ||
    subjectId < 1 ||
    !assessment ||
    assessment.length > 100 ||
    !Number.isFinite(marksObtained) ||
    marksObtained < 0
  ) {
    return NextResponse.json({ error: "Provide a valid student, subject, assessment and mark." }, { status: 422 });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    if (marksObtained > subject.maxMarks) {
      return NextResponse.json({ error: `Marks cannot exceed ${subject.maxMarks}.` }, { status: 422 });
    }
    const mark = await prisma.mark.create({
      data: { studentId, subjectId, assessment, marksObtained },
      include: {
        student: { select: { name: true, rollNo: true, section: true } },
        subject: { select: { subjectName: true, maxMarks: true, passMarks: true } },
      },
    });
    return NextResponse.json(mark, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This student already has marks for that subject and assessment." }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Selected student or subject does not exist." }, { status: 404 });
    }
    console.error("Unable to create mark.", error);
    return NextResponse.json({ error: "Unable to create mark." }, { status: 500 });
  }
}
