import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships wasm and must not be bundled.
  serverExternalPackages: ['@electric-sql/pglite'],
  typedRoutes: true,
  turbopack: { root: import.meta.dirname },
  // Cloud Run wants a self-contained server rather than the whole node_modules tree.
  output: 'standalone',
};

export default nextConfig;
