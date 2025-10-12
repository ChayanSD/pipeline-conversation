import prisma from "@/lib/db";
import { presentationSchema } from "@/validation/presentation.validation";
import { NextRequest ,NextResponse } from "next/server";


export async function GET() : Promise<NextResponse>{
  try {
    const presentations = await prisma.presentation.findMany({
      include: {
        categories: true,
        tests: true,
        user: {
          select : {
            name : true,
            email : true,
            avatarUrl : true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success : true,
      message : "Presentation fetch successfully",
      presentations
    },{
      status : 200
    });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presentations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) : Promise<NextResponse> {
  try {
    const body = await request.json();
    // Validate body using Zod
    const validatedData = presentationSchema.parse(body);
    const presentation = await prisma.presentation.create({
      data: {
        userId: validatedData.userId,
        title: validatedData.title,
      },
    });
    return NextResponse.json(presentation, { status: 201 });
  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json(
      { error: 'Failed to create presentation' },
      { status: 500 }
    );
  }
}