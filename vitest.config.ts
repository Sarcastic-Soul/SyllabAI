import { defineConfig } from "vitest/config";

import path from "path";

export default defineConfig({
  test: {
    css: false,
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    env: {
      DATABASE_URL: "postgres://mock:mock@mock:5432/mock",
    },
  },
});
