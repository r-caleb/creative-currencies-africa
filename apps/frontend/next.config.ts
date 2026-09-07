import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    distDir: isDevServer ? ".next-dev" : ".next",
    allowedDevOrigins: isDevServer ? ["127.0.0.1"] : undefined,
  };
};

export default nextConfig;
