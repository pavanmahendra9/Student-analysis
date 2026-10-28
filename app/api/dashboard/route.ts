import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [students, subjects, marks] = await Promise.all([
      prisma.student.findMany({ orderBy: { id: "asc" } }),
      prisma.subject.findMany({ orderBy: { id: "asc" } }),
      prisma.mark.findMany({
        include: {
          student: { select: { name: true, rollNo: true, section: true } },
          subject: { select: { subjectName: true, maxMarks: true, passMarks: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ students, subjects, marks });
  } catch (error) {
    console.error("Unable to load dashboard data.", error);
    return NextResponse.json({ error: "Unable to load dashboard data." }, { status: 500 });
  }
}
