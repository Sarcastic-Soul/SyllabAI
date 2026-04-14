"use client";

import { usePathname } from "next/navigation";

export default function ConditionalNavbar({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Hide the navbar strictly on the landing page and print pages
    if (pathname === "/" || pathname.endsWith("/print")) {
        return null;
    }

    return <>{children}</>;
}
