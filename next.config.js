/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  transpilePackages: [
    '@circle-fin/developer-controlled-wallets',
  ],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  serverExternalPackages: ['@anthropic-ai/sdk'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

module.exports = nextConfig;
