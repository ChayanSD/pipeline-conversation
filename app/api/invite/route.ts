import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, companyId, invitedById, role } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invitation.create({
      data: {
        email,
        companyId,
        invitedById,
        role,
        token,
        expiresAt,
      },
    });

    // TODO: Send email link with: `${process.env.APP_URL}/signup?token=${token}`

    return NextResponse.json(
      {
        success: true,
        message: "Invitation created successfully",
        data: invite,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
