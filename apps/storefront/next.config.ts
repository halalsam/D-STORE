import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker image (apps/storefront/Dockerfile) runs the standalone server.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const, outputFileTracingRoot: path.join(__dirname, "../..") }
    : {}),
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Product photos for the bundled demo catalog (src/lib/mock/catalog.json).
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" }],
  },
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
