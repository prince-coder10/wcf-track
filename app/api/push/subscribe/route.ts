import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { PushSubscription } from "@/models/PushSubscription";
import { Types } from "mongoose";


export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    console.log("this is user session", session)
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    await connectDB();

    const userAgent = req.headers.get("user-agent") || "";

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: new Types.ObjectId(session.sub),
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Subscription saved" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await connectDB();
    await PushSubscription.findOneAndDelete({
      endpoint,
      user: new Types.ObjectId(session.sub),
    });

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
