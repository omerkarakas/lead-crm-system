/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker deployment
  // Bu ayar, Next.js'i tüm bağımlılıklarla birlikte tek bir klasöre çıkarır
  output: 'standalone',

  // Docker için optimize edilmiş yapılandırma
  experimental: {
    // Memory kullanımını optimize et
    workerThreads: false,
    cpus: 1,
  },
}

module.exports = nextConfig
