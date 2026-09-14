import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // The app now has its own domain; send anyone who still has the old
  // Vercel-assigned URL bookmarked or linked somewhere on to it, rather
  // than serving the same site under two names.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "sg-migrant-worker-app.vercel.app" }],
        destination: "https://hellosgmm.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default withNextIntl(nextConfig);
