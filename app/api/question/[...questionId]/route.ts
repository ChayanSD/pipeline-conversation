import prisma from "@/lib/db";
import { updateQuestionSchema } from "@/validation/questions.validation";
import { Prisma } from "../../../../app/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) : Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const questionId = url.pathname.split("/").pop();

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const json = await req.json();
    const parsed = updateQuestionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, categoryId, options } = parsed.data;

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const updateData: Prisma.QuestionUpdateInput = {};

    if (text !== undefined) updateData.text = text;
    if (categoryId !== undefined) updateData.category = { connect: { id: categoryId } };

   if (options && Array.isArray(options)) {
      updateData.options = {
        upsert: options.map((opt) => ({
          where: { id: opt.id ?? "" },
          update: {
            text: opt.text,
            points: opt.points,
          },
          create: {
            text: opt.text,
            points: opt.points,
          },
        })),
      };
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: { options: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Question updated successfully",
        question: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[UPDATE_QUESTION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) : Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const questionId = url.pathname.split("/").pop();

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json(
      { success: true, message: "Question deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE_QUESTION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) : Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const questionId = url.pathname.split("/").pop();

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true, category: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    console.error("[GET_QUESTION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}