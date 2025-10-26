import prisma from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";
import { SignupSchema } from "@/validation/signup.validation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) : Promise<NextResponse> {
  try {
    const body = await request.json();
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error },
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
      role,
    } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(passCode, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passCode: hashedPassword,
        companyName,
        primaryColor,
        secondaryColor,
        profileImageUrl,
        companyLogoUrl,
        role,
      },
    });

    const sessionId = await createSession(user);
    await setSessionCookie(sessionId);

    return NextResponse.json(
      {
        success: true,
        message: "Registration Successful",
        data: user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
