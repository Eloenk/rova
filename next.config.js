/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@circle-fin/developer-controlled-wallets',
    '@circle-fin/adapter-circle-wallets',
    '@circle-fin/adapter-viem-v2',
    '@circle-fin/app-kit',
    '@circle-fin/bridge-kit'
  ],
  serverExternalPackages: [
    '@anthropic-ai/sdk',
  ],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
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
