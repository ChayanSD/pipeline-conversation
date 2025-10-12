import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function verifyTokenAndRole(
  authHeader: string | null | undefined,
  allowedRoles: string[]
) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Authorization token missing or malformed");
  }

  const token = authHeader.split(" ")[1];
  const payload = jwt.verify(token, JWT_SECRET);

  // TypeScript type guard
  if (
    typeof payload === "object" &&
    payload !== null &&
    "role" in payload &&
    typeof payload.role === "string"
  ) {
    if (!allowedRoles.includes(payload.role)) {
      throw new Error("Access denied: insufficient permissions");
    }
    return payload; // return the payload for use in the route handler
  }

  throw new Error("Invalid token payload");
}
