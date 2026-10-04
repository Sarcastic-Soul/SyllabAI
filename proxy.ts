import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const publicRoutes = [
    "/",
    "/auth",
    "/shared",
    "/sw.js",
    "/api/auth",
    "/api/health",
    // Razorpay calls this without a session; the route checks the signature itself
    "/api/razorpay/webhook",
];

const isPublicRoute = (pathname: string) =>
    publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

const protectRoute = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
    if (isPublicRoute(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    return protectRoute(request);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
