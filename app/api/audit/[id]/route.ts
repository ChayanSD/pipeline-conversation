import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { AuditCreateSchema } from "@/validation/audit.validation";
import { NextRequest, NextResponse } from "next/server";
import { invalidateCache } from "@/lib/cache";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.id;
    
    const url = new URL(req.url);
    const auditId = url.pathname.split("/").pop();

    if (!auditId) {
      return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
    }

    // Verify the audit belongs to the user
    const existingAudit = await prisma.presentation.findUnique({
      where: { id: auditId },
    });

    if (!existingAudit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (existingAudit.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AuditCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get existing audit with all related data
    const existingAuditWithData = await prisma.presentation.findUnique({
      where: { id: auditId },
      include: {
        categories: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!existingAuditWithData) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Update presentation title
    await prisma.presentation.update({
      where: { id: auditId },
      data: { title: data.title },
    });

    // Collect all existing IDs from payload
    const payloadCategoryIds = new Set(
      data.categories.filter((cat) => cat.id).map((cat) => cat.id!)
    );
    const payloadQuestionIds = new Set<string>();
    const payloadOptionIds = new Set<string>();

    data.categories.forEach((cat) => {
      cat.questions.forEach((q) => {
        if (q.id) payloadQuestionIds.add(q.id);
        q.options.forEach((opt) => {
          if (opt.id) payloadOptionIds.add(opt.id);
        });
      });
    });

    // Delete categories that are not in payload
    const categoriesToDelete = existingAuditWithData.categories.filter(
      (cat) => !payloadCategoryIds.has(cat.id)
    );
    if (categoriesToDelete.length > 0) {
      await prisma.category.deleteMany({
        where: {
          id: { in: categoriesToDelete.map((cat) => cat.id) },
        },
      });
    }

    // Process each category from payload
    for (const catData of data.categories) {
      if (catData.id && payloadCategoryIds.has(catData.id)) {
        // Update existing category
        const existingCategory = existingAuditWithData.categories.find(
          (c) => c.id === catData.id
        );

        if (existingCategory) {
          // Update category name and icon
          await prisma.category.update({
            where: { id: catData.id },
            data: {
              name: catData.name,
              icon: (catData.icon && catData.icon.trim()) ? catData.icon.trim() : null,
            },
          });

          // Collect question IDs from payload for this category
          const categoryQuestionIds = new Set(
            catData.questions.filter((q) => q.id).map((q) => q.id!)
          );

          // Delete questions not in payload
          const questionsToDelete = existingCategory.questions.filter(
            (q) => !categoryQuestionIds.has(q.id)
          );
          if (questionsToDelete.length > 0) {
            await prisma.question.deleteMany({
              where: {
                id: { in: questionsToDelete.map((q) => q.id) },
              },
            });
          }

          // Process each question
          for (const qData of catData.questions) {
            if (qData.id && categoryQuestionIds.has(qData.id)) {
              // Update existing question
              const existingQuestion = existingCategory.questions.find(
                (q) => q.id === qData.id
              );

              if (existingQuestion) {
                // Update question text
                await prisma.question.update({
                  where: { id: qData.id },
                  data: { text: qData.text },
                });

                // Collect option IDs from payload for this question
                const questionOptionIds = new Set(
                  qData.options.filter((opt) => opt.id).map((opt) => opt.id!)
                );

                // Delete options not in payload
                const optionsToDelete = existingQuestion.options.filter(
                  (opt) => !questionOptionIds.has(opt.id)
                );
                if (optionsToDelete.length > 0) {
                  await prisma.option.deleteMany({
                    where: {
                      id: { in: optionsToDelete.map((opt) => opt.id) },
                    },
                  });
                }

                // Process each option
                for (const optData of qData.options) {
                  if (optData.id && questionOptionIds.has(optData.id)) {
                    // Update existing option
                    await prisma.option.update({
                      where: { id: optData.id },
                      data: {
                        text: optData.text,
                        points: optData.points,
                      },
                    });
                  } else {
                    // Create new option
                    await prisma.option.create({
                      data: {
                        text: optData.text,
                        points: optData.points,
                        questionId: qData.id!,
                      },
                    });
                  }
                }
              }
            } else {
              // Create new question
              await prisma.question.create({
                data: {
                  text: qData.text,
                  categoryId: catData.id!,
                  options: {
                    create: qData.options.map((opt) => ({
                      text: opt.text,
                      points: opt.points,
                    })),
                  },
                },
              });
            }
          }
        }
      } else {
        // Create new category
        await prisma.category.create({
          data: {
            name: catData.name,
            icon: (catData.icon && catData.icon.trim()) ? catData.icon.trim() : null,
            presentationId: auditId,
            questions: {
              create: catData.questions.map((q) => ({
                text: q.text,
                options: {
                  create: q.options.map((opt) => ({
                    text: opt.text,
                    points: opt.points,
                  })),
                },
              })),
            },
          },
        });
      }
    }

    // Map category recommendations - use the category IDs from payload (they should already be correct)
    let mappedCategoryRecommendations = null;
    if (data.summary?.categoryRecommendations && Array.isArray(data.summary.categoryRecommendations)) {
      // Use the category IDs directly from the payload since we're preserving IDs
      mappedCategoryRecommendations = data.summary.categoryRecommendations;
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

    if (!updatedAudit) {
      return NextResponse.json({ error: "Audit not found after update" }, { status: 404 });
    }

    // Collect all cache keys to invalidate
    const cacheKeysToInvalidate = [
      `audit:${userId}`,
      'categories',
      `presentation:${userId}`,
      `presentation:id:${auditId}`,
    ];

    // Add category-specific caches
    updatedAudit.categories.forEach((category) => {
      cacheKeysToInvalidate.push(`category:${category.id}`);
      // Add question-specific caches
      category.questions.forEach((question) => {
        cacheKeysToInvalidate.push(`question:${question.id}`);
      });
    });

    // Invalidate all collected cache keys
    await Promise.all(cacheKeysToInvalidate.map(key => invalidateCache(key)));

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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

