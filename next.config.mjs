/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mastra and its MCP client are server-only packages. Marking them external
  // keeps them out of the client bundle and avoids bundling Node built-ins.
  // (Next 14 name; becomes `serverExternalPackages` in Next 15.)
  experimental: {
    serverComponentsExternalPackages: ["@mastra/core", "@mastra/mcp"],
  },
};

export default nextConfig;
