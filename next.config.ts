import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: `/${process.env.CLOUDINARY_CLOUD_NAME || "*"}/image/upload/**`, search: "" }],
    formats: ["image/webp"],
    maximumRedirects: 0,
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return ["/dashboard/:path*", "/api/:path*", "/sign-in", "/access-denied"].map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }));
  },
};
export default nextConfig;
