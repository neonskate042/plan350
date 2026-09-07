import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf читает файлы шрифтов с диска — не бандлим его, оставляем внешним.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
