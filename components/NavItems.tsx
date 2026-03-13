"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "New Course", href: "/courses/new" }, 
  { label: "My Journey", href: "/profile" },
];

const NavItems = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {navItems.map(({ label, href }) => (
        <Link
          href={href}
          key={label}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === href || (href !== "/" && pathname.startsWith(href))
              ? "text-primary font-semibold"
              : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
