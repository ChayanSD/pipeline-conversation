import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { redis } from "./redis";
import { User } from "../app/generated/prisma";

const SESSION_TTL = 60 * 60 * 24 * 7;
const COOKIE_NAME = "session_id";

export type SessionUser = Omit<User, "passCode">;

export async function createSession(user: User): Promise<string> {
  const sessionId = nanoid();
  const sessionData: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    primaryColor: user.primaryColor,
    secondaryColor: user.secondaryColor,
    profileImageUrl: user.profileImageUrl,
    companyLogoUrl: user.companyLogoUrl,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  await redis.setex(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  );

  return sessionId;
}

// export async function getSession(): Promise<SessionUser | null> {
//   const cookieStore = await cookies();
//   const sessionId = cookieStore.get(COOKIE_NAME)?.value;

//   if (!sessionId){
//     console.log('No session ID found in cookies');
//     return null;
//   }

//   const sessionData = await redis.get(`session:${sessionId}`);
//   console.log('Retrieved session data:', sessionData);
//   if (typeof sessionData !== "string") {
//     console.log('Invalid session data type:', typeof sessionData);
//     return null;
//   }

//   await redis.expire(`session:${sessionId}`, SESSION_TTL);

//   try {
//      const parsed = JSON.parse(sessionData) as SessionUser;
//     return {
//       ...parsed,
//       createdAt: new Date(parsed.createdAt),
//       updatedAt: new Date(parsed.updatedAt),
//     };
//   } catch {
//     return null;
//   }
// }

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore =await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    console.log("No session ID found in cookies");
    return null;
  }

  const sessionKey = `session:${sessionId}`;
  const sessionData = await redis.get<SessionUser>(sessionKey);

  if (!sessionData) {
    console.log(`No session found in Redis for key: ${sessionKey}`);
    return null;
  }

  // Extend TTL on access
  await redis.expire(sessionKey, SESSION_TTL);

  // Upstash already returns parsed JSON
  return {
    ...sessionData,
    createdAt: new Date(sessionData.createdAt),
    updatedAt: new Date(sessionData.updatedAt),
  };
}


export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId) {
    await redis.del(`session:${sessionId}`);
  }
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
