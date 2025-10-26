import prisma from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";
import { LoginSchema } from "@/validation/login.validation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) : Promise<NextResponse> {
  try {
    const body = await request.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error },
        { status: 400 }
      );
    }

    const { email, passCode } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or passCode" },
        { status: 401 }
      );
    }

    const isValidPassCode = await bcrypt.compare(passCode, user.passCode);
    if (!isValidPassCode) {
      return NextResponse.json(
        { error: "Invalid email or passCode" },
        { status: 401 }
      );
    }
    const sessionId = await createSession(user);
    await setSessionCookie(sessionId);
    return NextResponse.json(
      {
        success: true,
        message: "Login Successful",
        userId: user.id,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
