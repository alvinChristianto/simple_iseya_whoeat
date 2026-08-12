import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET!;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  return `${expires}.${sign(String(expires))}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiresStr, signature] = token.split(".");
  if (!expiresStr || !signature) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;

  const expected = sign(expiresStr);
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, Buffer.from(expected));
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  const actual = Buffer.from(pin);
  const expectedBuf = Buffer.from(expected);
  if (actual.length !== expectedBuf.length) return false;
  return timingSafeEqual(actual, expectedBuf);
}
