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
  const rollNo = typeof data.rollNo === "string" ? data.rollNo.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const section = typeof data.section === "string" ? data.section.trim() : "";
  if (!rollNo || rollNo.length > 50 || !name || name.length > 150 || !section || section.length > 50) {
    return NextResponse.json(
      { error: "Roll number, name and section are required and must fit their field limits." },
      { status: 422 },
    );
  }

  try {
    const student = await prisma.student.create({ data: { rollNo, name, section } });
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A student with that roll number already exists." }, { status: 409 });
    }
    console.error("Unable to create student.", error);
    return NextResponse.json({ error: "Unable to create student." }, { status: 500 });
  }
}
