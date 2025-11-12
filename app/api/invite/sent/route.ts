import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    const userId = session.id;

    // Get all invitations sent by this user
    const invitations = await prisma.invitation.findMany({
      where: {
        invitedById: userId,
      },
      include: {
        presentation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedInvitations = invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      role: invitation.role,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      presentation: invitation.presentation
        ? {
            id: invitation.presentation.id,
            title: invitation.presentation.title,
          }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedInvitations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

