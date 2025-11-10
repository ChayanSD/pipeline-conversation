import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { AuditCreateSchema } from "@/validation/audit.validation";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.id;
    
    const url = new URL(req.url);
    const auditId = url.pathname.split("/").pop();

    if (!auditId) {
      return Response.json({ error: "Audit ID is required" }, { status: 400 });
    }

    // Verify the audit belongs to the user
    const existingAudit = await prisma.presentation.findUnique({
      where: { id: auditId },
    });

    if (!existingAudit) {
      return Response.json({ error: "Audit not found" }, { status: 404 });
    }

    if (existingAudit.userId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AuditCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Delete existing categories and their related data (cascade will handle questions and options)
    await prisma.category.deleteMany({
      where: { presentationId: auditId },
    });

    // Create updated audit with new categories
    const audit = await prisma.presentation.update({
      where: { id: auditId },
      data: {
        title: data.title,
        categories: {
          create: data.categories.map((cat) => ({
            name: cat.name,
            questions: {
              create: cat.questions.map((q) => ({
                text: q.text,
                options: {
                  create: q.options.map((opt) => ({
                    text: opt.text,
                    points: opt.points,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        categories: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        summary: true,
      },
    });

    // Map category recommendations to new category IDs (by index since categories are created in order)
    let mappedCategoryRecommendations = null;
    if (data.summary?.categoryRecommendations && Array.isArray(data.summary.categoryRecommendations)) {
      mappedCategoryRecommendations = data.summary.categoryRecommendations.map((rec: { categoryId: string; recommendation: string }, idx: number) => ({
        categoryId: audit.categories[idx]?.id || rec.categoryId,
        recommendation: rec.recommendation,
      }));
    }

    // Update summary with mapped category IDs
    if (data.summary) {
      await prisma.summary.upsert({
        where: { presentationId: auditId },
        create: {
          presentationId: auditId,
          categoryRecommendations: mappedCategoryRecommendations
            ? JSON.stringify(mappedCategoryRecommendations)
            : null,
          nextSteps: data.summary.nextSteps
            ? JSON.stringify(data.summary.nextSteps)
            : null,
          overallDetails: data.summary.overallDetails || null,
        },
        update: {
          categoryRecommendations: mappedCategoryRecommendations
            ? JSON.stringify(mappedCategoryRecommendations)
            : undefined,
          nextSteps: data.summary.nextSteps
            ? JSON.stringify(data.summary.nextSteps)
            : undefined,
          overallDetails: data.summary.overallDetails !== undefined ? data.summary.overallDetails : undefined,
        },
      });
    }

    // Fetch updated audit with summary
    const updatedAudit = await prisma.presentation.findUnique({
      where: { id: auditId },
      include: {
        categories: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        summary: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Audit updated successfully",
        data: updatedAudit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating audit:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

