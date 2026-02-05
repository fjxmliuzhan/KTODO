import type { NextConfig } from "next";

const nextConfig: {
  reactStrictMode: true,
  transpilePackages: ['@supabase/ssr'],
  typescript: {
    // 暂时关闭严格类型检查
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
