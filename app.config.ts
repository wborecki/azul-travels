import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
  server: {
    // On Vercel CI, VERCEL=1 is set automatically — use vercel-edge preset.
    // In all other environments (local dev, Cloudflare deploy) keep cloudflare-module.
    preset: process.env.VERCEL ? "vercel-edge" : "cloudflare-module",
  },
});
