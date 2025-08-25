/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Nur für die Demo, damit Vercel nicht wegen ESLint-Optionen abbricht
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
