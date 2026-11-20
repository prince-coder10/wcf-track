import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { Notification } from "@/models/Notification";
import { Types } from "mongoose";



export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userObjectId = new Types.ObjectId(session.sub);

    const notifications = await Notification.find({ user: userObjectId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: userObjectId,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    console.log('session', session)
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds, markAll } = await req.json();

    await connectDB();
    const userObjectId = new Types.ObjectId(session.sub);

    if (markAll) {
      await Notification.updateMany(
        { user: userObjectId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      const validIds = notificationIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      await Notification.updateMany(
        { user: userObjectId, _id: { $in: validIds } },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
