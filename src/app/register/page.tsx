"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }
    if (password !== password2) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    void (async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      setLoading(false);
      if (!res.ok) {
        setError(data.message ?? "注册失败，请检查网络或服务器是否已配置数据库。");
        return;
      }
      router.push("/login?registered=1");
      router.refresh();
    })();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-xl font-semibold">注册账号</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          使用邮箱注册后，足迹与数据记录将绑定到你的账号并保存在服务器。
        </p>
      </div>
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
          密码（至少 8 位）
          <input
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          确认密码
          <input
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "提交中…" : "注册"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        已有账号？{" "}
        <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/login">
          登录
        </Link>
      </p>
    </div>
  );
}
