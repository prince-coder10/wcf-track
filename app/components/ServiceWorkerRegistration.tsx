"use client";

import { useEffect } from "react";
import InstallPromptModal from "./InstallPromptModal";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "development") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    } else if ("serviceWorker" in navigator) {
      // In dev mode, still register so push can be tested
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <InstallPromptModal />;
}
