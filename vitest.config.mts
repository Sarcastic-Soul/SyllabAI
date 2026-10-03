import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // An inline (empty) PostCSS config stops Vite from loading postcss.config.mjs,
  // whose Tailwind plugin is not needed for these Node-only tests.
  css: {
    postcss: {},
  },
  test: {
    css: false,
    environment: "node",
    exclude: ["**/node_modules/**", "**/.next/**"],
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
    env: {
      DATABASE_URL: "postgres://mock:mock@mock:5432/mock",
    },
  },
});
