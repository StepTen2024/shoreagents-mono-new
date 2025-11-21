/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // output: 'standalone', // ⚠️ DISABLED: Breaks dev mode static asset generation
  // Disable static generation for error pages to prevent Html import issues
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Skip static optimization for error pages
  skipTrailingSlashRedirect: true,
}

export default nextConfig
