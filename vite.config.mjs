import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sites } from "./build/sites-vite-plugin.mjs";

export default defineConfig(async () => {
  if (process.env.SITES_BUILD === "1") {
    const [{ default: vinext }, { cloudflare }] = await Promise.all([
      import("vinext"),
      import("@cloudflare/vite-plugin"),
    ]);

    process.env.WRANGLER_WRITE_LOGS ??= "false";
    process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

    return {
      plugins: [
        vinext(),
        sites(),
        cloudflare({
          viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
          config: {
            main: "./worker/index.js",
            compatibility_flags: ["nodejs_compat"],
          },
        }),
      ],
    };
  }

  return {
    optimizeDeps: {
      include: ["react", "react-dom/client"],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      warmup: {
        clientFiles: ["./src/main.jsx"],
      },
    },
    plugins: [react()],
  };
});
