import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider, Show } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import ConditionalNavbar from "@/components/shared/ConditionalNavbar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyllabAI",
  description: "The Ultimate AI-Powered LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: { colorPrimary: "#fe5933" } }}>
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
