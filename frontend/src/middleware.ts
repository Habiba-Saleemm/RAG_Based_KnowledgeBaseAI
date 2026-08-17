import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROUTES = ["/admin"];
const ADMIN_LOGIN_ROUTE = "/admin/login";

const PROTECTED_ROUTES = ["/dashboard", "/faq", "/chat", "/admin/:path*"];
const USER_AUTH_ROUTES = ["/login"];

const PUBLIC_ROUTES = [
  "/about/:path*",
  "/about2",
  "/contact",
  "/admin/register",
];
 
const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:5000";

async function getIsAdmin(sessionToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/me`, {
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return false;

    const data = await res.json();

    return Boolean(data?.user?.isAdmin);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get("session_token");

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminLoginPage = pathname.startsWith(ADMIN_LOGIN_ROUTE);

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isUserAuthRoute = USER_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // --- Public routes ---
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // --- Admin routes ---
  if (isAdminRoute && !isAdminLoginPage) {
    if (!sessionToken) {
      return NextResponse.redirect(
        new URL(ADMIN_LOGIN_ROUTE, request.url)
      );
    }

    const isAdmin = await getIsAdmin(sessionToken.value);

    if (!isAdmin) {
      return NextResponse.redirect(
        new URL(ADMIN_LOGIN_ROUTE, request.url)
      );
    }

    return NextResponse.next();
  }

  // --- Already logged in, visiting login page ---
  if ((isAdminLoginPage || isUserAuthRoute) && sessionToken) {
    const isAdmin = await getIsAdmin(sessionToken.value);

    const destination = isAdmin
      ? "/admin/faqs"
      : "/dashboard";

    return NextResponse.redirect(
      new URL(destination, request.url)
    );
  }

  // --- Regular protected routes ---
  if (isProtected && !sessionToken) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/faq/:path*",
    "/faqs/:path*",
    "/chat/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
    "/register/:path*",
    "/about/:path*",
  ],
};