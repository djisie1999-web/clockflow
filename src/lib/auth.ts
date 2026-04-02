import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "clockflow-dev-secret-change-in-production"
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "clockflow-refresh-dev-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const SALT_ROUNDS = 12;

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
}

// ─── Password Hashing ──────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token Creation ─────────────────────────────────────

export async function createAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET);
}

// ─── JWT Verification ───────────────────────────────────────

export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    if (payload.type !== "refresh") return null;
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

// ─── Cookie Management ──────────────────────────────────────

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies();

  cookieStore.set("cf_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set("cf_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("cf_access_token");
  cookieStore.delete("cf_refresh_token");
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("cf_access_token")?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("cf_refresh_token")?.value;
}

// ─── Auth Helpers ───────────────────────────────────────────

export async function getCurrentUser() {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true,
      isActive: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
          planTier: true,
          subscriptionStatus: true,
          onboardingComplete: true,
        },
      },
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

export async function getTenantId(): Promise<string> {
  const user = await requireAuth();
  if (!user.tenantId) throw new Error("No tenant context");
  return user.tenantId;
}

// ─── Token Pair Generation ──────────────────────────────────

export async function generateTokenPair(user: {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
}) {
  const accessToken = await createAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const refreshToken = await createRefreshToken(user.id);

  await db.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLoginAt: new Date(),
    },
  });

  return { accessToken, refreshToken };
}
