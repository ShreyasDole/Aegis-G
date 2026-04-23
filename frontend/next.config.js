/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable standalone output for production Docker builds
  output: 'standalone',
  
  // /api/* is proxied by src/app/api/[[...slug]]/route.ts (clear 503 when backend down).
  // Set INTERNAL_API_URL in Docker; host dev defaults to 127.0.0.1:8000 in that route.

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

