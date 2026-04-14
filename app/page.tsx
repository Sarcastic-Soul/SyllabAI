"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    ArrowRight,
    Loader2,
    BookOpen,
    Layers,
    Target,
    Bot,
    Sparkles,
    Zap,
} from "lucide-react";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    PricingTable,
} from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";

// Updated feature data to focus on Course Generation & LMS capabilities
const features = [
    {
        icon: <BookOpen className="w-6 h-6 text-primary" />,
        title: "Instant Course Generation",
        description:
            "Simply tell us what you want to learn. Our AI builds a comprehensive, structured curriculum in seconds.",
    },
    {
        icon: <Layers className="w-6 h-6 text-primary" />,
        title: "Structured Learning Paths",
        description:
            "Dive into highly organized chapters complete with in-depth lesson texts, code snippets, and clear explanations.",
    },
    {
        icon: <Target className="w-6 h-6 text-primary" />,
        title: "Interactive Quizzes & Tracking",
        description:
            "Test your knowledge at the end of every chapter, track your completion progress, and build your daily study streak.",
    },
    {
        icon: <Bot className="w-6 h-6 text-primary" />,
        title: "Voice-Enabled AI Tutor",
        description:
            "Stuck on a tough concept? Talk to your personal AI study buddy at any time for hands-free, personalized help.",
    },
];

export default function LandingPage() {
    const [loadingSignIn, setLoadingSignIn] = useState(false);
    const [loadingSignUp, setLoadingSignUp] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    return (
        <main className="min-h-screen flex flex-col items-center animate-fade-in overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="w-full max-w-6xl px-6 pt-4 pb-20 flex flex-col items-center text-center space-y-8">
                {/* Top Badge */}
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-muted/50 text-muted-foreground">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    <span>The Ultimate AI-Powered LMS</span>
                </div>

                <Image
                    src="/images/logo.png"
                    alt="Voice LMS Logo"
                    width={200}
                    height={100}
                    className="mb-4"
                />

                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight max-w-4xl text-balance">
                    Master Any Subject{" "}
                    <span className="text-primary">Instantly</span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl text-balance">
                    Turn any topic into a fully structured course. Generate
                    chapters, take quizzes, track your progress, and study with
                    a voice-enabled AI tutor.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                    <SignedOut>
                        <SignUpButton>
                            <Button
                                size="lg"
                                className="text-lg px-8 py-6 rounded-full w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
                                onClick={() => setLoadingSignUp(true)}
                                disabled={loadingSignUp}
                            >
                                {loadingSignUp ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Start Learning{" "}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </SignUpButton>

                        <SignInButton>
                            <Button
                                variant="outline"
                                size="lg"
                                className="text-lg px-8 py-6 rounded-full w-full sm:w-auto"
                                onClick={() => setLoadingSignIn(true)}
                                disabled={loadingSignIn}
                            >
                                {loadingSignIn ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="text-lg px-8 py-6 rounded-full w-full shadow-lg"
                                onClick={() => setLoadingDashboard(true)}
                                disabled={loadingDashboard}
                            >
                                {loadingDashboard ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Go to Dashboard{" "}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </Link>
                    </SignedIn>
                </div>

                {/* Hero Image Mockup */}
                <div className="w-full max-w-5xl mt-16 p-2 rounded-2xl bg-gradient-to-b from-border to-transparent">
                    <div className="rounded-xl overflow-hidden border bg-background shadow-2xl">
                        <Image
                            src="/images/voice-lms.png"
                            alt="Platform Preview"
                            width={1200}
                            height={800}
                            className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="w-full max-w-6xl px-6 py-24 border-t">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Everything you need to build your own curriculum
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Stop searching for the perfect tutorial. Generate a
                        tailored learning path that adapts to your pace and
                        tracks your progress.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col items-start text-left"
                        >
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section className="w-full max-w-6xl px-6 py-24 border-t flex flex-col items-center">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start learning with our free tier, or upgrade to Pro to
                        unlock unlimited course generation and advanced
                        features.
                    </p>
                </div>

                <div className="w-full max-w-4xl p-4 sm:p-8 border rounded-3xl bg-card shadow-sm flex justify-center">
                    <PricingTable />
                </div>
            </section>

            {/* --- BOTTOM CTA SECTION --- */}
            <section className="w-full max-w-4xl px-6 pb-24 text-center">
                <div className="p-12 rounded-3xl bg-primary text-primary-foreground space-y-8 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative Background Icon */}
                    <Zap className="absolute -right-10 -top-10 w-64 h-64 opacity-10" />

                    <h2 className="text-3xl md:text-5xl font-bold z-10">
                        Ready to design your learning path?
                    </h2>
                    <p className="text-lg opacity-90 max-w-xl z-10">
                        Join thousands of students and professionals who are
                        learning faster and retaining more with AI-generated
                        courses.
                    </p>

                    <div className="z-10">
                        <SignedOut>
                            <SignUpButton>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="text-lg px-8 py-6 rounded-full font-semibold"
                                >
                                    Generate Your First Course
                                </Button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="text-lg px-8 py-6 rounded-full font-semibold"
                                >
                                    Return to Dashboard
                                </Button>
                            </Link>
                        </SignedIn>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="w-full py-8 border-t mt-auto text-center text-sm text-muted-foreground flex flex-col items-center justify-center space-y-4">
                <Image
                    src="/images/logo.png"
                    alt="SyllabAI Logo"
                    width={50}
                    height={50}
                />
                <p>
                    © {new Date().getFullYear()} SyllabAI. All rights reserved.
                </p>
            </footer>
        </main>
    );
}
