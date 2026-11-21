import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests of the pure rules only (src/**/*.test.ts, tools/**/*.test.mjs). No browser, no React.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts", "tools/**/*.test.mjs"], environment: "node" },
});
