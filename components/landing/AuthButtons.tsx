import Link from "next/link";
import { getUserId } from "@/lib/auth/session";
import { btnLg, btnOutline, btnPrimary, btnQuiet, btnSm } from "./styles";

// Both read the session on the server, so the buttons are in the first HTML
// and do not pop in after the page loads.

export async function HeaderAuth() {
  const signedIn = Boolean(await getUserId());

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {signedIn ? (
        <Link href="/dashboard" className={`${btnPrimary} ${btnSm}`}>
          Open dashboard
        </Link>
      ) : (
        <>
          <Link href="/auth/sign-in" className={`${btnQuiet} ${btnSm}`}>
            Sign in
          </Link>
          <Link href="/auth/sign-up" className={`${btnPrimary} ${btnSm}`}>
            Start a course
          </Link>
        </>
      )}
    </div>
  );
}

export async function StartCta({ withSignIn = false }: { withSignIn?: boolean }) {
  const signedIn = Boolean(await getUserId());

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {signedIn ? (
        <Link href="/dashboard" className={`${btnPrimary} ${btnLg}`}>
          Open dashboard
        </Link>
      ) : (
        <>
          <Link href="/auth/sign-up" className={`${btnPrimary} ${btnLg}`}>
            Start a course
          </Link>
          {withSignIn && (
            <Link href="/auth/sign-in" className={`${btnOutline} ${btnLg}`}>
              Sign in
            </Link>
          )}
        </>
      )}
    </div>
  );
}
