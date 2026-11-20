import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  
  // If invoked via standard browser HTML form post, redirect to /login
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.json({ ok: true, redirect: "/login" });
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}
