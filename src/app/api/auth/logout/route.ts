import { NextResponse } from "next/server";
import { clearAuthCookies, getAccessTokenFromCookies, verifyAccessToken } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST() {
  try {
    // Clear refresh token from DB
    const token = await getAccessTokenFromCookies();
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload?.sub) {
        await db.user.update({
          where: { id: payload.sub },
          data: { refreshToken: null },
        });
      }
    }

    await clearAuthCookies();

    return NextResponse.json({ success: true });
  } catch {
    // Always clear cookies even if DB update fails
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
