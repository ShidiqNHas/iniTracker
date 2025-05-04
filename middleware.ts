import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get("user")?.value

  // Define protected routes
  const protectedRoutes = ["/timeline", "/project-tracker"]

  // Check if the requested path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // If it's a protected route and user is not logged in, redirect to login
  if (isProtectedRoute && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/timeline/:path*", "/project-tracker/:path*"],
}
