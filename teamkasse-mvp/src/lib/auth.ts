import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AppRole, StoredTeamMember, TeamState } from "@/lib/types";

const COOKIE_NAME = "teamkasse_session";
const SESSION_DAYS = 14;

export type Session = {
  memberId: string;
  role: AppRole;
  exp: number;
};

export function isAuthConfigured() {
  return Boolean(process.env.TEAMKASSE_ADMIN_PASSWORD && process.env.TEAMKASSE_SESSION_SECRET);
}

export function isPlayerRegistrationConfigured() {
  return Boolean(process.env.TEAMKASSE_JOIN_CODE?.trim());
}

export async function getCurrentSession(state: TeamState): Promise<Session | null> {
  if (!isAuthConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  const session = verifySession(raw);

  if (!session || session.exp < Date.now()) {
    return null;
  }

  const member = state.members.find((candidate) => candidate.id === session.memberId && candidate.active);

  if (!member || member.role !== session.role) {
    return null;
  }

  return session;
}

export async function setSessionCookie(member: StoredTeamMember) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = encodeBase64Url(
    JSON.stringify({
      memberId: member.id,
      role: member.role,
      exp
    } satisfies Session)
  );
  const value = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.TEAMKASSE_ADMIN_PASSWORD;

  if (!configured) {
    return false;
  }

  return timingSafeStringEqual(password, configured);
}

export function verifyJoinCode(code: string) {
  const configured = process.env.TEAMKASSE_JOIN_CODE?.trim();

  if (!configured) {
    return false;
  }

  return timingSafeStringEqual(code.trim(), configured);
}

export function hashPin(pin: string) {
  return createHmac("sha256", getSecret()).update(`pin:${pin}`).digest("hex");
}

export function verifyPin(pin: string, pinHash: string | null | undefined) {
  if (!pinHash) {
    return false;
  }

  return timingSafeStringEqual(hashPin(pin), pinHash);
}

function verifySession(raw: string): Session | null {
  const [payload, signature] = raw.split(".");

  if (!payload || !signature || !timingSafeStringEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as Session;

    if ((parsed.role === "admin" || parsed.role === "player") && typeof parsed.memberId === "string") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function getSecret() {
  const secret = process.env.TEAMKASSE_SESSION_SECRET;

  if (!secret) {
    throw new Error("TEAMKASSE_SESSION_SECRET fehlt.");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
