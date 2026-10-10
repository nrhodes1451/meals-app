import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships wasm and must not be bundled.
  serverExternalPackages: ['@electric-sql/pglite'],
  typedRoutes: true,
  turbopack: { root: import.meta.dirname },
  // Cloud Run wants a self-contained server rather than the whole node_modules tree.
  output: 'standalone',
  // Recipe photos are shrunk in the browser first; this leaves room for a dense page plus the
  // multipart overhead. The import action itself refuses anything over 4MB.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
};

export default nextConfig;
