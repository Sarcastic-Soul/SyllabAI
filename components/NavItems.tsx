"use client";

import Link from "next/link";
import { SignedIn } from "@clerk/nextjs";

const NavItems = () => {
  return (
    <ul className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
      <SignedIn>
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
      </SignedIn>
    </ul>
  );
};

export default NavItems;
