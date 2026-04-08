import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const p = req.nextUrl.pathname;
  if (
    p.startsWith("/api/auth") ||
    p.startsWith("/_next") ||
    p === "/favicon.ico" ||
    p === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  if (p === "/login" || p === "/register") {
    if (req.auth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth) {
    if (p.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", p + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
