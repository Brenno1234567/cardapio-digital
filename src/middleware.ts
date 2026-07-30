import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAuthenticated(request: NextRequest, roles: string[]): boolean {
  return roles.some((role) => request.cookies.get(`auth_${role}`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdmin = isAuthenticated(request, ["admin"]);
  const isKitchen = isAuthenticated(request, ["cozinha"]);
  const isStaff = isAdmin || isKitchen || isAuthenticated(request, ["atendente"]);

  if (pathname === "/cozinha" || pathname.startsWith("/cozinha/")) {
    const url = new URL(`/painel-pedidos${search}`, request.url);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/users")) {
    if (!isAdmin) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/settings")) {
    if (!isAdmin) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/painel-pedidos")) {
    if (!isAdmin && !isKitchen) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/login") && isStaff) {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    if (isKitchen) return NextResponse.redirect(new URL("/painel-pedidos", request.url));
    return NextResponse.redirect(new URL("/cardapio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/painel-pedidos/:path*",
    "/cozinha/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/login",
  ],
};
