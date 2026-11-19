import * as webpush from "web-push";
import { connectDB } from "@/lib/mongodb";
import { PushSubscription } from "@/models/PushSubscription";
import { Notification, NotificationPriority, NotificationType } from "@/models/Notification";
import mongoose from "mongoose";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:wcf.tracker@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface SendPushOptions {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send push notification to user devices and store in Notification inbox
 */
export async function sendNotificationToUser({
  userId,
  title,
  message,
  type,
  priority = "push",
  link = "/dashboard",
  metadata = {},
}: SendPushOptions) {
  await connectDB();

  // 1. Always record in Notification history
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    priority,
    link,
    metadata,
  });

  // If priority is in_app only, skip push
  if (priority === "in_app") {
    return { success: true, deliveredTo: 0, notificationId: notification._id };
  }

  // 2. Fetch user's active push subscriptions
  const subscriptions = await PushSubscription.find({ user: userId });
  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, deliveredTo: 0, notificationId: notification._id };
  }

  const payload = JSON.stringify({
    title,
    body: message,
    url: link,
    type,
    tag: `wcf-${type}`,
  });

  let delivered = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payload
      );
      delivered++;
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      // 404 or 410 means subscription expired or was unsubscribed
      if (error.statusCode === 404 || error.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        console.error("Failed to deliver web push:", err);
      }
    }
  }

  // Clean up any stale/expired endpoints
  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
  }

  return { success: true, deliveredTo: delivered, notificationId: notification._id };
}

/**
 * Send bundled assignment notification
 */
export async function sendAssignmentPush(userId: string, count: number) {
  const title = "New Assignment";
  const message =
    count === 1
      ? "You have a new person assigned to follow up"
      : `You have ${count} new people assigned to follow up`;

  return sendNotificationToUser({
    userId,
    title,
    message,
    type: "assignment",
    priority: "push",
    link: "/dashboard/people",
  });
}
