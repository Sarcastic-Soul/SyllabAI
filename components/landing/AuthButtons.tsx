"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { btnLg, btnOutline, btnPrimary, btnQuiet, btnSm } from "./styles";

export function HeaderAuth() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Show when="signed-out">
        <SignInButton>
          <button type="button" className={`${btnQuiet} ${btnSm}`}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton>
          <button type="button" className={`${btnPrimary} ${btnSm}`}>
            Start a course
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={`${btnPrimary} ${btnSm}`}>
          Open dashboard
        </Link>
      </Show>
    </div>
  );
}

export function StartCta({ withSignIn = false }: { withSignIn?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Show when="signed-out">
        <SignUpButton>
          <button type="button" className={`${btnPrimary} ${btnLg}`}>
            Start a course
          </button>
        </SignUpButton>
        {withSignIn && (
          <SignInButton>
            <button type="button" className={`${btnOutline} ${btnLg}`}>
              Sign in
            </button>
          </SignInButton>
        )}
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={`${btnPrimary} ${btnLg}`}>
          Open dashboard
        </Link>
      </Show>
    </div>
  );
}
