import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // PGlite is the local development database. Load it from node_modules, not the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Standard browser protections for every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody can show Dolphub inside a frame on their site, which blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Browsers must not guess file types, so an upload can't run as a script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Other sites see only "dolphub.tech" as the referrer, never the full page address.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The site never needs these browser features.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Always use https for the next two years.
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
  partialPrefetching: true,
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
