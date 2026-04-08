import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-zinc-500">加载中…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
