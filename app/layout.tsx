import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import PullToRefresh from "./components/PullToRefresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WCF Evangelism & Follow-up Tracker",
  description: "Winners' Campus Fellowship Evangelism & Follow-up Tracking App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WCF Tracker",
  },
  icons: {
    icon: [
      { url: "/logos/logo-96.png", sizes: "96x96", type: "image/png" },
      { url: "/logos/logo-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logos/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PullToRefresh />
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
