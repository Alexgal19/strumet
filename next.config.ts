
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  // This is to prevent the server from restarting when the config file is touched
  // by the build process.
  ignoredFilePatterns: ['**/next.config.ts'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  allowedDevOrigins: [
    "https://*.cloudworkstations.dev",
  ]
};

export default nextConfig;
