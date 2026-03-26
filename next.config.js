/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';
const defaultRuntimeCaching = require('next-pwa/cache');

const runtimeCaching = [
  {
    // Quran API – large cache, long TTL so pages remain available offline
    urlPattern: /\/api\/quran\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'quran-api-data',
      networkTimeoutSeconds: 15,
      expiration: {
        maxEntries: 3000,
        maxAgeSeconds: 604800,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  ...defaultRuntimeCaching,
];

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching,
  fallbacks: {
    document: '/offline',
  },
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withPWA(nextConfig);
