import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Lets the Playwright tests answer the server's calls to Proposales. Set only
// when the end-to-end tests build the app, so other builds do not mention it.
if (process.env.NEXT_TEST_PROXY === "1") {
  nextConfig.experimental = { testProxy: true };
}

export default nextConfig;
