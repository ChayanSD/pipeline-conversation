import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateScoreSchema = z.object({
  presentationId: z.string(),
  totalScore: z.number(),
  categoryScores: z.array(z.object({
    categoryId: z.string(),
    score: z.number(),
  })),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.id;

    const body = await request.json();
    const parsed = updateScoreSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", error: parsed.error },
        { status: 400 }
      );
    }

    const { presentationId, totalScore, categoryScores } = parsed.data;

    // Find the latest test for this user and presentation
    const existingTest = await prisma.test.findFirst({
      where: {
        userId,
        presentationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let test;
    if (existingTest) {
      // Update existing test
      test = await prisma.test.update({
        where: { id: existingTest.id },
        data: { totalScore },
      });

      // Delete existing category scores
      await prisma.categoryScore.deleteMany({
        where: { testId: test.id },
      });
    } else {
      // Create new test
      test = await prisma.test.create({
        data: {
          userId,
          presentationId,
          totalScore,
        },
      });
    }

    // Create/update category scores
    const categoryScoreRecords = [];
    for (const cs of categoryScores) {
      const categoryScore = await prisma.categoryScore.create({
        data: {
          testId: test.id,
          categoryId: cs.categoryId,
          score: cs.score,
        },
      });
      categoryScoreRecords.push(categoryScore);
    }

    return NextResponse.json({
      success: true,
      message: "Test score updated successfully",
      data: {
        testId: test.id,
        totalScore: test.totalScore,
        categoryScores: categoryScoreRecords,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("[UPDATE_TEST_SCORE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error },
      { status: 500 }
    );
  }
}

