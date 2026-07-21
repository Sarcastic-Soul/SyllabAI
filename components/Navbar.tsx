import Link from "next/link";
import Image from "next/image";
import { Show, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import NavItems from "@/components/NavItems";

const Navbar = async () => {
  // Check the user's plan via Clerk's auth helper
  const { has, userId } = await auth();

  // Only check for the plan if the user is actually logged in
  const isPro = userId ? has({ plan: "pro" }) : false;

  return (
    <nav className="navbar flex justify-between items-center p-4 border-b">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image src="/images/logo.png" alt="logo" width={80} height={50} />
        </div>
      </Link>

      <div className="flex items-center gap-8">
        {/* Safely imports the separate NavItems component now! */}
        <NavItems />

        <Show when="signed-in">
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <Link href="/subscription">
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

            <UserButton afterSignOutUrl="/" />
          </div>
        </Show>
      </div>
    </nav>
  );
};

export default Navbar;
