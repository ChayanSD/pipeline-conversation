import prisma from "@/lib/db";
import { categorySchema } from "@/validation/category.validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = categorySchema.safeParse(body);
   if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error },
        { status: 400 }
      );
    }

    const validatedData = result.data;
    const category = await prisma.category.create({
      data: {
        presentationId: validatedData.presentationId,
        name: validatedData.name,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Categories fetch successfully",
        categories,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
