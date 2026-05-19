import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.89",
    "localhost",
    "127.0.0.1",
    "glamorous-maurine-promonopoly.ngrok-free.dev",
  ],
  reactStrictMode: false,
};

export default nextConfig;
