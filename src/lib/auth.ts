import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecretKey(): Uint8Array {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext({ async: false });
      if (ctx?.env?.JWT_SECRET) {
        secret = ctx.env.JWT_SECRET as string;
      }
    } catch {}
  }
  return new TextEncoder().encode(
    secret || "c4t3dr4-encuest4-s3cr3t-k3y-2026-neon-auth-token-super-safe"
  );
}

const COOKIE_NAME = "catedra_admin_token";

export interface AdminPayload {
  id: number;
  usuario: string;
  nombre: string;
}

export async function createSession(payload: AdminPayload): Promise<string> {
  const secret = getSecretKey();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<AdminPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export { COOKIE_NAME };
