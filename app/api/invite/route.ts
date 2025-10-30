import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation is expired or already used" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        company: {
          id: invitation.company.id,
          name: invitation.company.name,
        },
      },
    });
  } catch (error) {
    console.error("Fetch Invitation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
