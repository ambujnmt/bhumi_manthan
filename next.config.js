/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "encrypted-tbn0.gstatic.com",
        },
      ],
    },

    // Admin panel URL by logged in role (same /admin pages):
    // /seller/dashboard, /broker/blog/blogList, /staff/... -> /admin/...
    async rewrites() {
      return {
        beforeFiles: ["seller", "broker", "staff"].flatMap((prefix) => [
          { source: `/${prefix}`, destination: "/admin/dashboard" },
          { source: `/${prefix}/:path*`, destination: "/admin/:path*" },
        ]),
      };
    },
  };

  module.exports = nextConfig;
