import prisma from "@/lib/db";
import { UserCreateSchema } from "@/validation/user.validation";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password ,role, avatarUrl } = UserCreateSchema.parse(body);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatarUrl
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration Successfull",
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


export async function GET() : Promise<NextResponse> {
  try {
    const users = await prisma.user.findMany({});
    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
