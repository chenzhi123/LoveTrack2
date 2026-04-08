"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const info =
    searchParams.get("registered") === "1"
      ? "注册成功，请使用刚才的邮箱与密码登录。"
      : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    void (async () => {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      setLoading(false);
      if (res?.error) {
        setError("邮箱或密码错误；若刚部署请确认已配置 DATABASE_URL 与 AUTH_SECRET。");
        return;
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/");
      router.refresh();
    })();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-xl font-semibold">登录 LoveTrack</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          使用注册时的邮箱与密码登录，数据将保存在服务器。
        </p>
      </div>
      {info ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {info}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          邮箱
          <input
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          密码
          <input
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        还没有账号？{" "}
        <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/register">
          注册
        </Link>
      </p>
    </div>
  );
}
