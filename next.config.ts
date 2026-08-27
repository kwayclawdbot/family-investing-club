import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: { remotePatterns: [] },
  async redirects() {
    // Product shift v3: Markets → Discover. Old links keep working.
    return [{ source: "/markets/:path*", destination: "/discover/:path*", permanent: true }, { source: "/markets", destination: "/discover", permanent: true }];
  },
};

export default nextConfig;
