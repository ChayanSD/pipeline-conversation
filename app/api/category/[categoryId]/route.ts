import prisma from "@/lib/db";
import { updateCategorySchema } from "@/validation/category.validation";
import { NextRequest, NextResponse } from "next/server";
import { withCache, invalidateCache } from "@/lib/cache";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  return withCache(`category:${categoryId}`, async () => {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Category fetched successfully",
          category,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching category:", error);
      return NextResponse.json(
        { error: "Failed to fetch category" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error },
        { status: 400 }
      );
    }

    const { presentationId, name } = result.data;
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (presentationId !== undefined)
      updateData.presentationId = presentationId;
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Invalidate caches
    await invalidateCache(`category:${categoryId}`);
    await invalidateCache('categories');

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Invalidate caches
    await invalidateCache(`category:${categoryId}`);
    await invalidateCache('categories');

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
