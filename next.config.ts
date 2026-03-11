import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.base.org',
      },
      {
        protocol: 'https',
        hostname: '*.coinbase.com',
      }
    ],
  },

  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Typed routes (moved from experimental in Next.js 16)
  typedRoutes: false,

  // Webpack configuration to suppress specific warnings
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Suppress Next.js prop serialization warnings for client components
    if (!isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },

  // Experimental features
  experimental: {
    // Suppress client component prop serialization warnings
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Suppress specific warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
