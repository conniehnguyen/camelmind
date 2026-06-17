import type { NextConfig } from "next";

const isOffline = process.env.OFFLINE_MODE === "true"

const nextConfig: NextConfig = {
  // Static export for offline builds — no server required
  ...(isOffline ? { output: "export", trailingSlash: true } : {}),
};

export default nextConfig;
