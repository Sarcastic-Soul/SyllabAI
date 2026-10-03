import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  serverExternalPackages: ["unpdf"],
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@clerk/nextjs",
      "@icons-pack/react-simple-icons",
      "motion",
      "recharts",
    ],
  },
};

export default nextConfig;
