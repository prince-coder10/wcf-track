import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import { sendNotificationToUser } from "@/services/push.service";
import mongoose from "mongoose";


/**
 * Daily Morning (9:00 AM) Cron Endpoint
 * Checks for follow-ups due today and sends generic lockscreen alerts.
 * Can be triggered via external cron job, GitHub Actions, or Vercel Cron.
 */
export async function GET(req: NextRequest) {
  try {
    // Optional secret key protection for cron caller
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find follow-ups due today that are assigned
    const duePeople = await Person.find({
      assignedTo: { $ne: null },
      nextFollowUpAt: { $gte: todayStart, $lte: todayEnd },
    }).select("assignedTo");

    // Group count by assigned user
    const userDueCounts: Record<string, number> = {};
    for (const p of duePeople) {
      if (p.assignedTo) {
        const uid = p.assignedTo.toString();
        userDueCounts[uid] = (userDueCounts[uid] || 0) + 1;
      }
    }

    let notificationsDispatched = 0;

    for (const [userId, count] of Object.entries(userDueCounts)) {
      if (!mongoose.Types.ObjectId.isValid(userId)) continue;

      const title = "Follow-up Due Today";
      const message =
        count === 1
          ? "You have 1 follow-up scheduled for today"
          : `You have ${count} follow-ups scheduled for today`;

      await sendNotificationToUser({
        userId,
        title,
        message,
        type: "followup_due",
        priority: "push",
        link: "/dashboard/people",
      });

      notificationsDispatched++;
    }

    return NextResponse.json({
      success: true,
      dueCount: duePeople.length,
      usersNotified: notificationsDispatched,
    });
  } catch (error) {
    console.error("Error in daily reminders cron:", error);
    return NextResponse.json(
      { error: "Failed to process daily reminders" },
      { status: 500 }
    );
  }
}
