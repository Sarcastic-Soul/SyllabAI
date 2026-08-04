"use client";

import Link from "next/link";
import { Show, useUser } from "@clerk/nextjs";

const NavItems = () => {
  const { user } = useUser();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail?.toLowerCase() === "anishisbusy@gmail.com";

  return (
    <ul className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-sm font-medium text-muted-foreground">
      <Show when="signed-in">
        <li>
          <Link
            href="/dashboard"
            className="hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/courses/new"
            className="hover:text-primary transition-colors"
          >
            New Course
          </Link>
        </li>
        <li>
          <Link
            href="/profile"
            className="hover:text-primary transition-colors"
          >
            My Journey
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link
              href="/admin"
              className="hover:text-primary transition-colors"
            >
              Admin
            </Link>
          </li>
        )}
      </Show>
    </ul>
  );
};

export default NavItems;
