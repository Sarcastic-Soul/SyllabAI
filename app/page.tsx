"use client";

import { useState } from "react";
import Image from "next/image";
import { GitFork } from "lucide-react";
import AnimatedBackground from "@/components/landing/AnimatedBackground";
import GradientMeshBackground from "@/components/landing/GradientMeshBackground";
import NoiseOverlay from "@/components/landing/NoiseOverlay";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import TrustBadges from "@/components/landing/TrustBadges";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import BottomCtaSection from "@/components/landing/BottomCtaSection";

export default function LandingPage() {
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [loadingSignUp, setLoadingSignUp] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden relative bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Topmost Subtle Grain/Noise Texture Overlay */}
      <NoiseOverlay />

      {/* Animated Hero Gradient Mesh Blobs */}
      <GradientMeshBackground />

      {/* Ambient tsParticles & Grid Pattern */}
      <AnimatedBackground />

      {/* Sticky Glassmorphic Header */}
      <LandingHeader
        loadingSignIn={loadingSignIn}
        loadingSignUp={loadingSignUp}
        loadingDashboard={loadingDashboard}
        setLoadingSignIn={setLoadingSignIn}
        setLoadingSignUp={setLoadingSignUp}
        setLoadingDashboard={setLoadingDashboard}
      />

      {/* Main Content Sections */}
      <main className="w-full flex flex-col items-center px-0 pt-0 max-w-none bg-transparent">
        {/* Hero Section */}
        <HeroSection
          loadingSignIn={loadingSignIn}
          loadingSignUp={loadingSignUp}
          loadingDashboard={loadingDashboard}
          setLoadingSignIn={setLoadingSignIn}
          setLoadingSignUp={setLoadingSignUp}
          setLoadingDashboard={setLoadingDashboard}
        />

        {/* Social Proof / Stats Bar */}
        <StatsSection />

        {/* Tech Credibility Strip */}
        <TrustBadges />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Personas & Use Cases Section */}
        <UseCasesSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Accordion Section */}
        <FAQSection />

        {/* Bottom CTA Section */}
        <BottomCtaSection />
      </main>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-border/60 text-center text-sm text-muted-foreground flex flex-col items-center justify-center space-y-4 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="SyllabAI Logo"
            width={60}
            height={30}
            className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
          <span className="text-border">|</span>
          <a
            href="https://github.com/Sarcastic-Soul/SyllabAI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium text-xs"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
        </div>
        <p>© {new Date().getFullYear()} SyllabAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
