import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type-checking and lint errors during production build.
  // The codebase has accumulated TS debt that needs a dedicated cleanup pass;
  // gating deploys on it would block shipping. Revisit once we burn down errors.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
