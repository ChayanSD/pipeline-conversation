import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { SignupSchema } from "@/validation/signup.validation";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.message },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      passCode,
      companyName,
      primaryColor,
      secondaryColor,
      profileImageUrl,
      companyLogoUrl,
      inviteToken,
    } = parsed.data;

    const hashedPass = await bcrypt.hash(passCode, 10);
    let user;
    let company;

    if (inviteToken) {
      // --- Invite-based registration ---
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
        include: { company: true },
      });

      if (
        !invitation ||
        invitation.status !== "PENDING" ||
        invitation.expiresAt < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid or expired invitation" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already registered" },
          { status: 409 }
        );
      }

      user = await prisma.user.create({
        data: {
          name,
          email: invitation.email,
          passCode: hashedPass,
          companyId: invitation.companyId,
          role: invitation.role,
          primaryColor: primaryColor ?? "#000000",
          secondaryColor: secondaryColor ?? "#FFFFFF",
          profileImageUrl,
        },
        include: { company: true },
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          expiresAt: new Date(),
        },
      });

      company = user.company;
    } else {
      // --- Normal registration ---
      if (!companyName) {
        return NextResponse.json(
          { error: "Company name is required for normal signup" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      const [newCompany, newUser] = await prisma.$transaction([
        prisma.company.create({
          data: {
            name: companyName,
            logoUrl: companyLogoUrl ?? null,
          },
        }),
        prisma.user.create({
          data: {
            name,
            email: email!,
            passCode: hashedPass,
            role: "ADMIN",
            primaryColor: primaryColor ?? "#000000",
            secondaryColor: secondaryColor ?? "#FFFFFF",
            profileImageUrl,
            company: {
              create: {
                name: companyName,
                logoUrl: companyLogoUrl ?? null,
              },
            },
          },
          include: { company: true },
        }),
      ]);

      user = newUser;
      company = newCompany;
    }

    // --- Create session with user + company ---
    const sessionId = await createSession({
      ...user,
      company, 
    });

    await setSessionCookie(sessionId);

    return NextResponse.json(
      {
        success: true,
        message: inviteToken
          ? "Invitation accepted and user registered successfully"
          : "Company and user registered successfully",
        data: { user },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
