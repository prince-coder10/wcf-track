import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/invite";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const uid = searchParams.get("uid") || undefined;

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Missing invitation token" },
      { status: 400 }
    );
  }

  const { user, error } = await verifyInviteToken(token, uid);

  if (!user) {
    return NextResponse.json(
      { valid: false, error: error || "Invalid or expired invitation link" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    user: {
      id: String(user._id),
      fullName: user.fullName,
      login: user.login,
      role: user.role,
      unit: user.unit || "Follow-up",
    },
  });
}
