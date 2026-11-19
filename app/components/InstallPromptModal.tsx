"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPromptModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (PWA) mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standaloneMode) {
      setTimeout(() => setIsStandalone(true), 0);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setTimeout(() => setIsIOS(isIosDevice), 0);

    // Check if dismissed recently (in this session / last 24h)
    const dismissedAt = localStorage.getItem("wcf_pwa_prompt_dismissed");
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 24 * 60 * 60 * 1000) {
        return; // Don't show if dismissed within 24 hours
      }
    }

    // Android / Desktop Chrome PWA handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // On iOS Safari, show custom banner after a 3s delay
    let timer: NodeJS.Timeout | undefined;
    if (isIosDevice) {
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("wcf_pwa_prompt_dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-blue-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center">
            <Image
              src="/logos/logo-96.png"
              alt="WCF Tracker"
              width={40}
              height={40}
              className="object-contain rounded-lg"
            />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Install WCF Tracker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Install the app on your home screen for instant access and notifications.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Timely follow-up alerts & reminders</span>
            </div>
          </div>
        </div>

        {/* Action Button: Android/Chrome vs iOS instructions */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {isIOS ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="text-slate-700 dark:text-slate-200">
                Tap <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> then select{" "}
                <span className="font-medium underline decoration-blue-500 underline-offset-2">
                  Add to Home Screen
                </span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
