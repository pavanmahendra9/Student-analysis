import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    return NextResponse.json({ error: "Student ID must be a positive integer." }, { status: 400 });
  }

  try {
    await prisma.student.delete({ where: { id: studentId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    console.error("Unable to delete student.", error);
    return NextResponse.json({ error: "Unable to delete student." }, { status: 500 });
  }
}
