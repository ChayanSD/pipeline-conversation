import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { Prisma } from "@/app/generated/prisma";
import { z } from "zod";

const progressSchema = z.object({
  answers: z.record(z.string(), z.string()).optional(),
});

type RouteContext = {
  params: Promise<{ presentationId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const presentationId =
      resolvedParams?.presentationId ??
      request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!presentationId) {
      return NextResponse.json(
        { error: "Presentation ID is required" },
        { status: 400 }
      );
    }

    const progress = await prisma.auditProgress.findUnique({
      where: { presentationId },
    });

    return NextResponse.json(
      {
        answers:
          (progress?.answers as Record<string, string> | null | undefined) || {},
        updatedAt: progress?.updatedAt ?? null,
        updatedBy: progress?.updatedBy ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_AUDIT_PROGRESS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const presentationId =
      resolvedParams?.presentationId ??
      request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!presentationId) {
      return NextResponse.json(
        { error: "Presentation ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const answers = (parsed.data.answers || {}) as Prisma.InputJsonValue;

    await prisma.auditProgress.upsert({
      where: { presentationId },
      update: {
        answers,
        updatedBy: session.email || session.name || "unknown",
      },
      create: {
        presentationId,
        answers,
        updatedBy: session.email || session.name || "unknown",
      },
    });

    return NextResponse.json(
      { success: true, message: "Progress saved" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SAVE_AUDIT_PROGRESS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}

