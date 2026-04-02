import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  verifyRefreshToken,
  getRefreshTokenFromCookies,
  generateTokenPair,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth";

export async function POST() {
  try {
    const refreshToken = await getRefreshTokenFromCookies();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Verify user exists and token matches
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
        refreshToken: true,
      },
    });

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Generate new token pair
    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token refresh error:", error);
    await clearAuthCookies();
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
