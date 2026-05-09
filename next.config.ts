import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "better-sqlite3", "pdf-parse"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
