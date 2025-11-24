import prisma from "@/lib/db";
import { updatePresentationSchema } from "@/validation/presentation.validation";
import { NextRequest, NextResponse } from "next/server";
import { withCache, invalidateCache } from "@/lib/cache";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const presentationId = url.pathname.split("/").pop();

  if (!presentationId) {
    return NextResponse.json(
      { error: "Presentation ID is required" },
      { status: 400 }
    );
  }

  return withCache(`presentation:id:${presentationId}`, async () => {
    try {
      const presentation = await prisma.presentation.findUnique({
        where: { id: presentationId },
        include: {
          categories: {
            include: {
              questions: {
                include: {
                  options: true,
                },
              },
            },
          },
          summary: true,
        },
      });

      if (!presentation) {
        return NextResponse.json(
          { error: "Presentation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Presenatioan fetched successfully",
          presentation,
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
  const presentationId = url.pathname.split("/").pop();

  if (!presentationId) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const result = updatePresentationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error },
        { status: 400 }
      );
    }

    const { userId, title } = result.data;
    const existingPresentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });
    if (!existingPresentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (userId !== undefined) updateData.userId = userId;
    if (title !== undefined) updateData.title = title;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const presentation = await prisma.presentation.update({
      where: { id: presentationId },
      data: updateData,
    });

    // Invalidate caches
    await invalidateCache(`presentation:id:${presentationId}`);
    await invalidateCache(`presentation:${presentation.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Presenation updated successfully",
        presentation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating presentaton:", error);
    return NextResponse.json(
      { error: "Failed to update presentaton" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const presentationId = url.pathname.split("/").pop();

  if (!presentationId) {
    return NextResponse.json(
      { error: "presentaton ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get the presentation to know the userId before deleting
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    await prisma.presentation.delete({
      where: { id: presentationId },
    });

    // Invalidate caches
    await invalidateCache(`presentation:id:${presentationId}`);
    await invalidateCache(`presentation:${presentation.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Presenation deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting presentation:", error);
    return NextResponse.json(
      { error: "Failed to delete presentaton" },
      { status: 500 }
    );
  }
}
