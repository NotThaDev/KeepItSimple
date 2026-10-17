import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  // rewrites() is read when the app is built, so fail early instead of proxying to "undefined".
  throw new Error("API_BASE_URL is not set.");
}

const nextConfig: NextConfig = {
  // The browser calls /api on this origin, so the auth cookies are first-party and no CORS is needed.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
