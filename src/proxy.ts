import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function proxy(req: NextRequest) {
  const PUBLIC_ROUTES = ["/"]
  const PUBLIC_APIS = ["/api/auth"]

  const pathname = req.nextUrl.pathname

  // skip next internals + static files (FIX FOR YOUR IMAGE ISSUE)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/.well-known") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // public routes
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_APIS.some((api) => pathname.startsWith(api))
  ) {
    return NextResponse.next()
  }

  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const role = session.user.role

  // ADMIN ONLY
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // PARTNER ONLY (allow onboarding)
  if (
    pathname.startsWith("/partner") &&
    !pathname.startsWith("/partner/onboarding") &&
    role !== "partner"
  ) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // API protection
  if (pathname.startsWith("/api") && !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}