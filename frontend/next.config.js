/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Base configuration
  const baseConfig = {
    reactStrictMode: true,
    // Disable i18n for development testing
    i18n: null,
    // Set the workspace root for proper file tracing in monorepo
    outputFileTracingRoot: path.join(__dirname, '..'),
    // Standalone is for Docker/Linux images. On Windows, Next.js creates
    // symlinks during standalone tracing and fails with EPERM unless Developer
    // Mode is enabled — that breaks local pre-push builds. Docker builds run
    // on Linux and still get standalone output.
    output:
      isProduction && process.platform !== "win32" ? "standalone" : undefined,
    // Environment variables to be exposed to the client
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000/api',
    },
    // Redirects configuration
    async redirects() {
      return [
        {
          source: '/',
          destination: '/de',
          permanent: false,
        },
      ];
    },
    // TypeScript configuration (applies to all environments)
    typescript: {
      // Skip type checking during build on server (already validated in CI/CD)
      // Set SKIP_TYPE_CHECK=true to skip type checking during build
      ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
    },
  };

  // Development configuration
  const developmentConfig = {
    ...baseConfig,
    allowedDevOrigins: ["161.97.67.253", "localhost", "127.0.0.1"],
  };

  // Production configuration
  const productionConfig = {
    ...baseConfig,
    // Production origins (only trusted)
    allowedDevOrigins: ["your-production-domain.com", "your-cdn-domain.com"],
    // Optimizations for production
    compiler: {
      // Remove console.log but keep console.error
      removeConsole: isProduction
        ? {
            exclude: ["error", "warn"],
          }
        : false,
    },
    // Compression
    compress: true,
    // Production optimizations
    productionBrowserSourceMaps: false, // Disable source maps for faster build
    experimental: {
      // Disable CSS optimization to fix critters issue with Emotion
      optimizeCss: false,
      esmExternals: true,
      // Enable faster compilation
      optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
    // Reduce build output
    typescript: {
      // Skip type checking during production build on server (already validated in CI/CD)
      // Set SKIP_TYPE_CHECK=true to skip type checking during build
      ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
    },
  };

  // Select configuration based on environment
  const config = isProduction ? productionConfig : developmentConfig;

  // Next.js injects `polyfill-module` for all browsers (Array.at, Object.hasOwn, …)
  // even when browserslist already targets modern engines. Drop it to clear
  // Lighthouse "Legacy JavaScript" (~14 KiB). Do not do this if you must support
  // older Safari / Chrome than our browserslist.
  const emptyPolyfill = path.join(__dirname, 'src/lib/empty-polyfill.js');
  config.turbopack = {
    ...(config.turbopack || {}),
    resolveAlias: {
      ...((config.turbopack && config.turbopack.resolveAlias) || {}),
      '../build/polyfills/polyfill-module': emptyPolyfill,
      'next/dist/build/polyfills/polyfill-module': emptyPolyfill,
    },
  };
  config.webpack = (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '../build/polyfills/polyfill-module': false,
      'next/dist/build/polyfills/polyfill-module': false,
    };
    return webpackConfig;
  };

  // Add CORS headers function
  config.headers = async () => {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: isProduction
              ? "http://161.97.67.253"
              : "*", // В разработке разрешаем все
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  };

  return config;
};

module.exports = nextConfig;
