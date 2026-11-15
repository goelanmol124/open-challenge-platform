/**
 * Stateless session: an HS256 JWT in an httpOnly cookie.
 * Edge-safe (used by src/proxy.ts) — no Node-only imports here.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ocp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = { sub: string; role: string };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
    }
    // Development fallback so `npm run dev` works out of the box.
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-0000");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: typeof payload.role === "string" ? payload.role : "solver" };
  } catch {
    return null;
  }
}
