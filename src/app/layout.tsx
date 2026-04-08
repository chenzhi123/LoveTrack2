import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FirstVisitConsent } from "@/components/permissions/first-visit-consent";
import { SiteNav } from "@/components/layout/site-nav";
import { AppProviders } from "@/components/providers/app-providers";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoveTrack · 足迹地图",
  description:
    "情侣、朋友、家人共享地图空间，记录打卡足迹，支持离线缓存、云镜像同步与导出分享。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LoveTrack",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <SessionProvider>
          <AppProviders>
            <FirstVisitConsent />
            <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6">
              <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  LoveTrack
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  登录后数据保存在服务器；足迹支持账号云端快照同步
                </p>
                <SiteNav />
              </div>
              {children}
            </div>
          </AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
