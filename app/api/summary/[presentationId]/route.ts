import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { SummaryCreateSchema, SummaryUpdateSchema } from "@/validation/summary.validation";
import { NextRequest, NextResponse } from "next/server";

// GET summary by presentation ID
export async function GET(
  req: NextRequest,
  { params }: { params: { presentationId: string } }
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { presentationId } = params;

    // Verify the presentation belongs to the user
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
      include: {
        categories: true,
        summary: true,
      },
    });

    if (!presentation) {
      return Response.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (presentation.userId !== session.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: presentation.summary,
        categories: presentation.categories,
      },
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create summary
export async function POST(
  req: NextRequest,
  { params }: { params: { presentationId: string } }
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { presentationId } = params;

    // Verify the presentation belongs to the user
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return Response.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (presentation.userId !== session.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if summary already exists
    const existingSummary = await prisma.summary.findUnique({
      where: { presentationId },
    });

    if (existingSummary) {
      return Response.json(
        { error: "Summary already exists. Use PATCH to update." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = SummaryCreateSchema.safeParse({
      ...body,
      presentationId,
    });

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const summary = await prisma.summary.create({
      data: {
        presentationId: data.presentationId,
        categoryRecommendations: data.categoryRecommendations
          ? JSON.parse(JSON.stringify(data.categoryRecommendations))
          : null,
        nextSteps: data.nextSteps
          ? JSON.parse(JSON.stringify(data.nextSteps))
          : null,
        overallDetails: data.overallDetails || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Summary created successfully",
        data: summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating summary:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH update summary
export async function PATCH(
  req: NextRequest,
  { params }: { params: { presentationId: string } }
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { presentationId } = params;

    // Verify the presentation belongs to the user
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return Response.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (presentation.userId !== session.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = SummaryUpdateSchema.safeParse({
      ...body,
      presentationId,
    });

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if summary exists, create if not
    const existingSummary = await prisma.summary.findUnique({
      where: { presentationId },
    });

    let summary;
    if (existingSummary) {
      // Update existing summary
      summary = await prisma.summary.update({
        where: { presentationId },
        data: {
          categoryRecommendations:
            data.categoryRecommendations !== undefined
              ? JSON.parse(JSON.stringify(data.categoryRecommendations))
              : undefined,
          nextSteps:
            data.nextSteps !== undefined
              ? JSON.parse(JSON.stringify(data.nextSteps))
              : undefined,
          overallDetails: data.overallDetails !== undefined ? data.overallDetails : undefined,
        },
      });
    } else {
      // Create new summary
      summary = await prisma.summary.create({
        data: {
          presentationId: data.presentationId,
          categoryRecommendations: data.categoryRecommendations
            ? JSON.parse(JSON.stringify(data.categoryRecommendations))
            : null,
          nextSteps: data.nextSteps
            ? JSON.parse(JSON.stringify(data.nextSteps))
            : null,
          overallDetails: data.overallDetails || null,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Summary updated successfully",
        data: summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating summary:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

