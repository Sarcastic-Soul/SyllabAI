"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@neondatabase/auth-ui";
import { btnLg, btnOutline, btnPrimary, btnQuiet, btnSm } from "./styles";

export function HeaderAuth() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <SignedOut>
        <Link href="/auth/sign-in" className={`${btnQuiet} ${btnSm}`}>
          Sign in
        </Link>
        <Link href="/auth/sign-up" className={`${btnPrimary} ${btnSm}`}>
          Start a course
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={`${btnPrimary} ${btnSm}`}>
          Open dashboard
        </Link>
      </SignedIn>
    </div>
  );
}

export function StartCta({ withSignIn = false }: { withSignIn?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SignedOut>
        <Link href="/auth/sign-up" className={`${btnPrimary} ${btnLg}`}>
          Start a course
        </Link>
        {withSignIn && (
          <Link href="/auth/sign-in" className={`${btnOutline} ${btnLg}`}>
            Sign in
          </Link>
        )}
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={`${btnPrimary} ${btnLg}`}>
          Open dashboard
        </Link>
      </SignedIn>
    </div>
  );
}
