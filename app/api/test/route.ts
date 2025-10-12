import { verifyTokenAndRole } from "@/utils/verifyTokenAndRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const user = verifyTokenAndRole(authHeader, ["USER"]);
    console.log(user)
    return NextResponse.json({ message: `Hello Admin ${user.name}!` });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 403 });
  }
}