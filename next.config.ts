import type { NextConfig } from "next";

const imageKitEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const imageKitHost = imageKitEndpoint
  ? new URL(imageKitEndpoint).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    localPatterns: [
      {
        pathname: "/assets/**",
        search: "",
      },
    ],
    remotePatterns: imageKitHost
      ? [
          {
            protocol: "https",
            hostname: imageKitHost,
            pathname: "/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
