
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-select'],
  },
  serverExternalPackages: ['express'],
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|js|css|ico|woff2)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          }
        ],
      },
    ]
  },
};

export default withBundleAnalyzer(nextConfig);
