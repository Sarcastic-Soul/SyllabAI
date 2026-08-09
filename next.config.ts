import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@clerk/nextjs",
      "@icons-pack/react-simple-icons",
      "motion",
      "recharts",
    ],
    serverActions: {
      bodySizeLimit: "10mb", // Adjust this value as needed
    },
  },
};

export default nextConfig;
