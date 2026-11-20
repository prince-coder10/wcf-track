"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PermState = "prompt" | "granted" | "denied" | "unsupported";

export default function PushNotificationManager() {
  const [permState, setPermState] = useState<PermState>("prompt");
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Subscribe to push and send subscription to server
  const ensureSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not set");
          return;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
        });
      }

      // Send subscription to server
      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!p256dh || !auth) {
        console.error("Push subscription keys missing");
        return;
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          },
        }),
      });

      console.log("Push subscription registered successfully");
    } catch (err) {
      console.error("Failed to subscribe to push:", err);
    }
  }, []);

  // Check current permission state on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPermState("unsupported");
        return;
      }

      const perm = Notification.permission;
      if (perm === "granted") {
        setPermState("granted");
        // Ensure subscription exists
        void ensureSubscription();
      } else if (perm === "denied") {
        setPermState("denied");
      } else {
        setPermState("prompt");
        // Show prompt banner after a 3-second delay (don't bombard on page load)
        const bannerTimer = setTimeout(() => {
          // Only show if user hasn't already been asked
          if (!sessionStorage.getItem("push-banner-dismissed")) {
            setShowBanner(true);
          }
        }, 3000);
        return () => clearTimeout(bannerTimer);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [ensureSubscription]);

  const handleEnableNotifications = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setPermState("granted");
        setShowBanner(false);
        await ensureSubscription();
      } else if (permission === "denied") {
        setPermState("denied");
        setShowBanner(false);
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    } finally {
      setSubscribing(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("push-banner-dismissed", "true");
  };

  // Don't render anything if already granted, denied, or unsupported
  if (!showBanner || permState !== "prompt") {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Enable Notifications
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Get notified about new assignments, follow-up reminders, and important updates.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnableNotifications}
                disabled={subscribing}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {subscribing ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={dismissBanner}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
