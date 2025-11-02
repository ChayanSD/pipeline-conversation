import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request : NextRequest) {
  try {
    const url = new URL(request.url);

    const presentationId = url.pathname.split("/").pop();

    if (!presentationId) {
      return NextResponse.json({ error: 'Presentation ID is required' }, { status: 400 });
    }

    // Get all categories for this presentation
    const categories = await prisma.category.findMany({
      where: {
        presentationId: presentationId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Flatten all questions from all categories
    const questions = categories.flatMap(category =>
      category.questions.map(question => ({
        ...question,
        category: {
          id: category.id,
          name: category.name,
          presentationId: category.presentationId,
        },
      }))
    );

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error('[GET_QUESTIONS_FOR_PRESENTATION_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}