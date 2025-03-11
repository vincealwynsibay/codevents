import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The link-preview routes read this font from disk at runtime; make sure it ships with the server build.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./lib/fonts/**"],
    "/og/event/[id]": ["./lib/fonts/**"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
