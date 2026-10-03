import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import ConditionalNavbar from "@/components/shared/ConditionalNavbar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyllabAI",
  description:
    "Turn a topic or a PDF into a structured course with lessons, quizzes, flashcards and a study buddy.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: { colorPrimary: "#e8471f" } }}>
          <Show when="signed-in">
            {/* 2. Wrapped Navbar */}
            <ConditionalNavbar>
              <Navbar />
            </ConditionalNavbar>
          </Show>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
