"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";

export default function PullToRefresh() {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const THRESHOLD = 64; // Distance in px to trigger refresh

  useEffect(() => {
    // Only enable if running in standalone PWA or iOS device
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (!isStandalone) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh if page is scrolled at the very top
      if (window.scrollY <= 0) {
        setStartY(e.touches[0].clientY);
      } else {
        setStartY(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only pull down when at the top of scroll
      if (diff > 0 && window.scrollY <= 0) {
        // Apply resistance physics
        const distance = Math.min(diff * 0.45, 90);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(50); // Keep indicator visible during refresh

        // Full browser reload to bypass client-side caches and fetch completely fresh data
        window.location.reload();
      } else {
        setPullDistance(0);
        setStartY(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, pullDistance, isRefreshing]);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 flex justify-center items-center z-50 pointer-events-none transition-transform duration-150"
      style={{
        transform: `translateY(${pullDistance}px)`,
      }}
    >
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-md rounded-full p-2 flex items-center justify-center">
        <RotateCw
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: `rotate(${pullDistance * 4}deg)`,
          }}
        />
      </div>
    </div>
  );
}
