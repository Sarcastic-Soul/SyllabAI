"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, GitFork } from "lucide-react";
import { motion } from "motion/react";

interface LandingHeaderProps {
  loadingSignIn: boolean;
  loadingSignUp: boolean;
  loadingDashboard: boolean;
  setLoadingSignIn: (val: boolean) => void;
  setLoadingSignUp: (val: boolean) => void;
  setLoadingDashboard: (val: boolean) => void;
}

export default function LandingHeader({
  loadingSignIn,
  loadingSignUp,
  loadingDashboard,
  setLoadingSignIn,
  setLoadingSignUp,
  setLoadingDashboard,
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between relative">
        {/* Logo (Left aligned) */}
        <Link href="/" className="flex items-center gap-2 group z-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Image
              src="/images/logo.png"
              alt="SyllabAI Logo"
              width={140}
              height={45}
              className="h-10 w-auto object-contain"
              priority
              loading="eager"
            />
          </motion.div>
        </Link>

        {/* Dead-Centered Navigation links (Always perfectly centered regardless of button width/auth state) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2 bg-card/70 border border-border/60 rounded-full px-6 py-2 shadow-xs backdrop-blur-md z-10">
          <a
            href="#features"
            className="hover:text-primary transition-colors py-0.5"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-primary transition-colors py-0.5"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="hover:text-primary transition-colors py-0.5"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="hover:text-primary transition-colors py-0.5"
          >
            FAQ
          </a>
        </nav>

        {/* Action Buttons (Right aligned) */}
        <div className="flex items-center gap-3 z-10">
          {/* GitHub Repository Icon Button */}
          <a
            href="https://github.com/Sarcastic-Soul/SyllabAI"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border/80 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <GitFork className="h-4 w-4" />
                <span className="sr-only">GitHub Repository</span>
              </Button>
            </motion.div>
          </a>

          <Show when="signed-out">
            <SignInButton>
              <Button
                variant="ghost"
                size="sm"
                className="font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setLoadingSignIn(true)}
                disabled={loadingSignIn}
              >
                {loadingSignIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </SignInButton>

            <SignUpButton>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  className="rounded-full px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/25 transition-all"
                  onClick={() => setLoadingSignUp(true)}
                  disabled={loadingSignUp}
                >
                  {loadingSignUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </motion.div>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  className="rounded-full px-5 font-semibold bg-primary text-primary-foreground shadow-md hover:shadow-primary/25 transition-all"
                  onClick={() => setLoadingDashboard(true)}
                  disabled={loadingDashboard}
                >
                  {loadingDashboard ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Dashboard
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}
