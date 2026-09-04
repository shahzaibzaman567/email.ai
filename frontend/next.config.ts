import type { NextConfig } from "next";

const nextConfig = {
  // Allow local network IP testing so Next.js doesn't block requests from other devices
  allowedDevOrigins: ["192.168.8.100", "localhost"],
} as any;

export default nextConfig;
