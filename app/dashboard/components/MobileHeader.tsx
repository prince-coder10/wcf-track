"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "@/app/components/NotificationBell";

export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-100">
          <Image
            src="/logos/logo-192.png"
            alt="WCF Logo"
            width={32}
            height={32}
            className="object-cover scale-105"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900 tracking-tight leading-none">
            WCF TRACKER
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            Evangelism &amp; Follow-up
          </span>
        </div>
      </Link>

      <div className="flex items-center">
        <NotificationBell align="right" />
      </div>
    </header>
  );
}
