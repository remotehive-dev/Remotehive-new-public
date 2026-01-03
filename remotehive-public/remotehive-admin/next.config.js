/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/fast2sms/:path*',
        destination: 'https://www.fast2sms.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
