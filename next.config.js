/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Quran API – large cache, long TTL so all 604 pages & surahs survive
      urlPattern: /\/api\/quran\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quran-api-data',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 3000,       // 604 pages + 114 surahs + 30 juz + extras
          maxAgeSeconds: 604800,  // 7 days
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // App shell & navigation
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'app-shell',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withPWA(nextConfig);
