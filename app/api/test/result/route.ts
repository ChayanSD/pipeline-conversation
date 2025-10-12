import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({
        success: false,
        message: "Missing userId parameter",
      }, {
        status: 400,
    })
  }

  try {
    const tests = await prisma.test.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        answers: {
          include: {
            question: {
              select: { id: true, text: true, categoryId: true },
            },
            option: {
              select: { id: true, text: true, points: true },
            },
          },
        },
        categoryScores: {
          select: { id: true, categoryId: true, score: true },
        },
        presentation: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "User test results fetched successfully",
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching user test results:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user test results",
      },
      {
        status: 500,
      }
    );
  }
}
