import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
