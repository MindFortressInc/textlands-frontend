import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // wiki.textlands.com root -> /wiki
        {
          source: "/",
          has: [{ type: "host", value: "wiki.textlands.com" }],
          destination: "/wiki",
        },
        {
          source: "/",
          has: [{ type: "host", value: "wiki.localhost:3000" }],
          destination: "/wiki",
        },
      ],
      afterFiles: [
        // wiki.textlands.com paths -> /wiki/* (after static matching)
        {
          source: "/:path*",
          has: [{ type: "host", value: "wiki.textlands.com" }],
          destination: "/wiki/:path*",
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
