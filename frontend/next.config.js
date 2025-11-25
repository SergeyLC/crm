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
