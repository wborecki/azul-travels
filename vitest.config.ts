/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    typecheck: {
      // Garante que `expectTypeOf` é avaliado em tempo de teste —
      // sem isso ele só roda no `tsc` global e perde sinal no CI.
      enabled: true,
    },
  },
});
