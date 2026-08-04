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
    <nav className="navbar flex justify-between items-center p-4 border-b">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image
            src="/images/logo.png"
            alt="logo"
            width={80}
            height={50}
            style={{ width: "auto" }}
            priority
          />
        </div>
      </Link>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Hide inline NavItems on small screens */}
        <div className="hidden md:block">
          <NavItems />
        </div>

        <Show when="signed-in">
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <Link href="/subscription" className="hidden sm:block">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                  isPro
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isPro ? "Pro Plan" : "Basic Plan"}
              </span>
            </Link>

            <UserButton />
            
            {/* Mobile hamburger menu */}
            <MobileMenu />
          </div>
        </Show>
      </div>
    </nav>
  );
};

export default Navbar;
