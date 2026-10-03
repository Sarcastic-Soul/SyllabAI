"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NavItems = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail?.toLowerCase() === "anishisbusy@gmail.com";

  const items = [
    { href: "/dashboard", label: "Courses" },
    { href: "/courses/new", label: "New course" },
    { href: "/profile", label: "Progress" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      // Course and chapter pages belong to "Courses", the new-course form does not
      return (
        pathname === "/dashboard" ||
        (pathname.startsWith("/courses/") && !pathname.startsWith("/courses/new"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <ul className="flex flex-col text-sm font-medium md:flex-row md:items-center md:gap-1">
      <Show when="signed-in">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-md px-3 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-9",
                  active
                    ? "font-semibold text-foreground md:bg-muted"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </Show>
    </ul>
  );
};

export default NavItems;
