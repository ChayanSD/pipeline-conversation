import prisma from '@/lib/db';
import { createQuestionSchema } from '@/validation/questions.validation';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const parsed = createQuestionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, categoryId, options } = parsed.data;

    const question = await prisma.question.create({
      data: {
        text,
        categoryId,
        options: {
          create: options.map((opt) => ({
            text: opt.text,
            points: opt.points,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ message: 'Question created', question }, { status: 201 });

  } catch (error) {
    console.error('[CREATE_QUESTION_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(){
    try {
        const questions = await prisma.question.findMany({
            include : {
                options : true
            }
        });

        return NextResponse.json({
            success : true,
            message : "question fetched successfullly",
            questions
        })
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message : "something went wrong"
        },{
            status : 500
        })
    }
}