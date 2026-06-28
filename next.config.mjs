/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.vusercontent.net'],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    inlineCss: true,
  },
}

export default nextConfig
