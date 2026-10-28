import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const markId = Number(id);
  if (!Number.isSafeInteger(markId) || markId < 1) {
    return NextResponse.json({ error: "Mark ID must be a positive integer." }, { status: 400 });
  }

  try {
    await prisma.mark.delete({ where: { id: markId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Mark not found." }, { status: 404 });
    }
    console.error("Unable to delete mark.", error);
    return NextResponse.json({ error: "Unable to delete mark." }, { status: 500 });
  }
}
