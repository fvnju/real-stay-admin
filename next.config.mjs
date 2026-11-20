/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The client router keeps a page that it opened for 5 minutes (the
    // pages are client components; their data comes from RTK Query), so a
    // second visit needs no server request.
    staleTimes: { dynamic: 300, static: 300 },
  },
};

export default nextConfig;
