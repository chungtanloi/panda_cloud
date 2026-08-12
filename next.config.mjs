/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Figma-exported assets are committed under /public/assets.
    // Add your CDN / backend host here when serving dynamic images.
    remotePatterns: [],
  },
};

export default nextConfig;
