import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/catalog/**", "**/node_modules/**", "brightloop-finance/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
