// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import prisma from "@/lib/db";

import prisma from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";
import { LoginSchema } from "@/validation/login.validation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// const LoginSchema = z.object({
//   email: z.email("Invalid email"),
//   password: z.string().min(8, "Password is required"),
// });

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const data = LoginSchema.parse(body);

//     const user = await prisma.user.findUnique({
//       where: { email: data.email },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
//     }

//     const isPasswordValid = await bcrypt.compare(data.password, user.password);
//     if (!isPasswordValid) {
//       return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         role : user.role
//       },
//       JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     return NextResponse.json({
//         success : true,
//         message : "Login Successfull",
//         token,
//         userId : user.id
//          }, { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   } finally {
//     await prisma.$disconnect();
//   }
// }

export async function POST(request: NextRequest) {
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
