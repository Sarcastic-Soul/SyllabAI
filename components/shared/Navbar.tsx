import Link from "next/link";
import Image from "next/image";
import { Show, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import NavItems from "@/components/shared/NavItems";
import MobileMenu from "@/components/shared/MobileMenu";

const Navbar = async () => {
  // Check the user's plan via Clerk's auth helper
  const { has, userId } = await auth();

  // Only check for the plan if the user is actually logged in
  const isPro = userId ? has({ plan: "pro" }) : false;

  return (
    <nav
      aria-label="Main"
      className="relative z-40 border-b border-border bg-card print:hidden"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="SyllabAI home"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Image
            src="/logo.svg"
            alt="SyllabAI"
            width={80}
            height={50}
            style={{ width: "auto" }}
            priority
          />
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Inline links on desktop, MobileMenu below md */}
          <div className="hidden md:block">
            <NavItems />
          </div>

          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link
                href="/subscription"
                className={`hidden h-7 items-center rounded-sm border px-2 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex ${
                  isPro
                    ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {isPro ? "Pro plan" : "Basic plan"}
              </Link>

              <UserButton />

              <MobileMenu />
            </div>
          </Show>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
