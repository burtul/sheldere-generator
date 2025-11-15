/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👈 это ключевой параметр

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
