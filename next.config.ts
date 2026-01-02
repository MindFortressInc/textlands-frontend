import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // wiki.textlands.com -> /wiki/*
        {
          source: "/",
          has: [{ type: "host", value: "wiki.textlands.com" }],
          destination: "/wiki",
        },
        {
          source: "/:path*",
          has: [{ type: "host", value: "wiki.textlands.com" }],
          destination: "/wiki/:path*",
        },
        // Also handle wiki.localhost for local dev
        {
          source: "/",
          has: [{ type: "host", value: "wiki.localhost:3000" }],
          destination: "/wiki",
        },
        {
          source: "/:path*",
          has: [{ type: "host", value: "wiki.localhost:3000" }],
          destination: "/wiki/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
