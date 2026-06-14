import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const proxy = process.env.NEXT_PUBLIC_API_PROXY;
    if (proxy) {
      return [{ source: '/api/v1/:path*', destination: `${proxy}/api/v1/:path*` }];
    }
    return [];
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@fitnxt/shared': path.resolve(__dirname, '../../packages/shared/src'),
    };
    return config;
  },
};

export default nextConfig;
