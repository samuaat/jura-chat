import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  async rewrites() {
    return [
      {
        source: "/api/chat",
        destination: "https://ssrjurav2-74elkdduqa-ew.a.run.app/api/chat",
      },
    ];
  },
};

export default nextConfig;
