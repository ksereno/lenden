import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    // The Lenden pages moved under /lenden/* when LendenX was added, so old
    // bookmarks/PWA shortcuts to these paths would otherwise 404.
    return [
      { source: "/loans", destination: "/lenden/loans", permanent: true },
      { source: "/loans/:path*", destination: "/lenden/loans/:path*", permanent: true },
      { source: "/pool", destination: "/lenden/pool", permanent: true },
      { source: "/borrowers", destination: "/lenden/borrowers", permanent: true },
      { source: "/borrowers/:path*", destination: "/lenden/borrowers/:path*", permanent: true },
      { source: "/me", destination: "/lenden/me", permanent: true },
      { source: "/commissions", destination: "/lenden/commissions", permanent: true },
    ];
  },
};

export default nextConfig;
