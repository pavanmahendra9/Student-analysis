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
  const subjectName = typeof data.subjectName === "string" ? data.subjectName.trim() : "";
  const maxMarks = Number(data.maxMarks);
  const passMarks = Number(data.passMarks);
  if (
    !subjectName ||
    subjectName.length > 150 ||
    !Number.isFinite(maxMarks) ||
    maxMarks <= 0 ||
    !Number.isFinite(passMarks) ||
    passMarks < 0 ||
    passMarks > maxMarks
  ) {
    return NextResponse.json({ error: "Provide a name and valid maximum/pass marks." }, { status: 422 });
  }

  try {
    const subject = await prisma.subject.create({ data: { subjectName, maxMarks, passMarks } });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A subject with that name already exists." }, { status: 409 });
    }
    console.error("Unable to create subject.", error);
    return NextResponse.json({ error: "Unable to create subject." }, { status: 500 });
  }
}
