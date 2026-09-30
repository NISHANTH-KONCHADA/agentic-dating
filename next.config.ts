import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: '*.linkedin.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
    ],
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
