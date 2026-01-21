
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'picsum.photos', 'lh3.googleusercontent.com'],
    unoptimized: true, // Necessário para deploy estático ou se não quiser usar otimização de imagem do Next
  },
}

module.exports = nextConfig
