"use client";

import { usePathname } from "next/navigation";

export default function ConditionalNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the navbar strictly on the landing page
  if (pathname === "/") {
    return null;
  }

  return <>{children}</>;
}