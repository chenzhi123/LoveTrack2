"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "足迹地图" },
  { href: "/records", label: "数据记录" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const onAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <nav className="mt-3 flex flex-wrap items-center gap-2" aria-label="主导航">
      {!onAuthPage &&
        links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      {session?.user?.email ? (
        <>
          <span className="ml-auto hidden max-w-[200px] truncate text-xs text-zinc-500 sm:inline">
            {session.user.email}
          </span>
          <button
            type="button"
            className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            退出
          </button>
        </>
      ) : null}
    </nav>
  );
}
