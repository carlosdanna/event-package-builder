import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets the Playwright tests answer the server's calls to Proposales.
    // Only on when the end-to-end tests start the server.
    testProxy: process.env.NEXT_TEST_PROXY === "1",
  },
};

export default nextConfig;
