import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/sw.js"];

const isPublicRoute = (pathname: string) =>
    publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

const middleware = clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;

    if (!isPublicRoute(pathname)) {
        await auth.protect();
    }

    return NextResponse.next();
});

export default middleware;

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
