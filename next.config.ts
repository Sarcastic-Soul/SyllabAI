import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["unpdf"],
  async redirects() {
    return [
      { source: "/sign-in", destination: "/auth/sign-in", permanent: false },
      { source: "/sign-up", destination: "/auth/sign-up", permanent: false },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@icons-pack/react-simple-icons",
      "motion",
      "recharts",
    ],
  },
};

export default nextConfig;
