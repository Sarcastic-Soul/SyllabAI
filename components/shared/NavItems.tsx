"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";

const NavItems = () => {
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
      </Show>
    </ul>
  );
};

export default NavItems;
