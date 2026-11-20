import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/services/email.service";

const ForgotPasswordSchema = z.object({
  login: z.string().min(1, "Please enter your email or username").trim().toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 422 }
      );
    }

    const { login } = parsed.data;

    await connectDB();

    const user = await User.findOne({ login }).select("+invite.tokenHash");

    // Generic safe message (doesn't reveal user existence)
    const genericResponse = {
      ok: true,
      message: "If an active account exists with that identifier, an email with a 10-minute reset link has been dispatched.",
    };

    if (!user || user.status !== "active") {
      return NextResponse.json(genericResponse);
    }

    // Generate random one-time token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.invite = {
      tokenHash,
      purpose: "reset",
      expiresAt,
    };

    await user.save();

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}&uid=${user._id}`;

    // Send email using email service
    // If login is an email, send to it; otherwise if user has an email format
    const targetEmail = user.login.includes("@") ? user.login : null;

    if (targetEmail) {
      await sendPasswordResetEmail({
        to: targetEmail,
        fullName: user.fullName,
        resetUrl,
        expiresInMinutes: 10,
      });
    } else {
      console.log(`[PASSWORD_RESET] User ${user.login} does not have an email address formatted login. Reset URL: ${resetUrl}`);
    }

    return NextResponse.json({
      ...genericResponse,
      // Include resetUrl only if SMTP is not configured or in dev mode
      resetUrl: !process.env.SMTP_HOST ? resetUrl : undefined,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error("Error generating password reset link:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
