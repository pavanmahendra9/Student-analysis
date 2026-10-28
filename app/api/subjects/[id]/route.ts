import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const subjectId = Number(id);
  if (!Number.isSafeInteger(subjectId) || subjectId < 1) {
    return NextResponse.json({ error: "Subject ID must be a positive integer." }, { status: 400 });
  }

  try {
    await prisma.subject.delete({ where: { id: subjectId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }
    console.error("Unable to delete subject.", error);
    return NextResponse.json({ error: "Unable to delete subject." }, { status: 500 });
  }
}
