import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module: keep it out of the bundle and load it from node_modules.
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
