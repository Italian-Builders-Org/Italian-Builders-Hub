import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ command }) => {
  const rawPort = process.env.PORT;

  if (command !== "build" && !rawPort) {
    throw new Error(
      "PORT environment variable is required when running the dev or preview server.",
    );
  }

  const port = rawPort ? Number(rawPort) : 5173;

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = process.env.BASE_PATH || "/";

  const shouldUploadSentrySourcemaps =
    command === "build" && Boolean(process.env.SENTRY_AUTH_TOKEN);

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      ...(shouldUploadSentrySourcemaps
        ? [
            sentryVitePlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: "italian-builders",
              project: "italian-builders-hub",
              telemetry: false,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: shouldUploadSentrySourcemaps,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
