import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for production builds to use stable webpack
  turbopack: undefined,
  // Allow MacBook to access dev server over local network
  allowedDevOrigins: ['192.168.2.28'],
};

export default nextConfig;
