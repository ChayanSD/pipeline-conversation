import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";


const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const LoginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role : user.role
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
        success : true,
        message : "Login Successfull",
        token
         }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
