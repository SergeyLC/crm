/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Base configuration
  const baseConfig = {
    reactStrictMode: true,
    // Set the workspace root for proper file tracing in monorepo
    outputFileTracingRoot: path.join(__dirname, '..'),
  };

  // Development configuration
  const developmentConfig = {
    ...baseConfig,
    allowedDevOrigins: ["161.97.67.253", "localhost", "127.0.0.1"],
    // Additional settings for development
    eslint: {
      ignoreDuringBuilds: true,
    },
  };

  // Production configuration
  const productionConfig = {
    ...baseConfig,
    // Production origins (only trusted)
    allowedDevOrigins: ["your-production-domain.com", "your-cdn-domain.com"],
    // Optimizations for production
    compiler: {
      // Remove console.log but keep console.error
      // removeConsole: isProduction
      //   ? {
      //       exclude: ["error"],
      //     }
      //   : false,
    },
    // Compression
    compress: true,
    experimental: {
      // Disable CSS optimization to fix critters issue with Emotion
      optimizeCss: false, // Disable CSS optimization
      esmExternals: true, // nur für neue Browser
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
