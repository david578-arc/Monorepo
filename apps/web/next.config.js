/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-url.vercel.app/api/:path*'
          : 'http://localhost:3001/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig