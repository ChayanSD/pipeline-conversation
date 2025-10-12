import prisma from "@/lib/db";
import { submitTestSchema } from "@/validation/test.validaton";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const parsed = submitTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error },
        { status: 400 }
      );
    }

    const { presentationId, userId, answers } = parsed.data;

    const test = await prisma.test.create({
      data: { userId, presentationId },
    });
    let totalScore = 0;
    const categoryScores: Record<string, number> = {};
    // 2. Process each answer
    for (const ans of answers) {
      const option = await prisma.option.findUnique({
        where: { id: ans.optionId },
        select: {
          points: true,
          question: { select: { categoryId: true } },
        },
      });

      if (!option) continue;

      const { points, question } = option;
      const categoryId = question.categoryId;

      totalScore += points;
      categoryScores[categoryId] = (categoryScores[categoryId] || 0) + points;

      await prisma.answer.create({
        data: {
          testId: test.id,
          questionId: ans.questionId,
          optionId: ans.optionId,
          points,
        },
      });
    }

    // 3. Store per-category scores
    const categoryScoreRecords = [];
    for (const [categoryId, score] of Object.entries(categoryScores)) {
      const cs = await prisma.categoryScore.create({
        data: {
          testId: test.id,
          categoryId,
          score,
        },
      });
      categoryScoreRecords.push(cs);
    }

    // 4. Update test total score
    await prisma.test.update({
      where: { id: test.id },
      data: { totalScore },
    });

    // 5. Respond
    return NextResponse.json({
      success: true,
      message: "Test submitted successfully",
      data: {
        testId: test.id,
        totalScore,
        categoryScores: categoryScoreRecords,
      },
    },{
        status : 200
    });
  } catch (error) {
    console.error("[SUBMIT_TEST_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error },
      { status: 500 }
    );
  }
}
