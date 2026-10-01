/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve image files as-is by default. Vercel's image optimiser is a paid
    // feature: on the free (Hobby) plan every /_next/image request came back
    // "402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED" and every photo on the site
    // broke. The photos in /public are pre-compressed (max 1800px, ~200-600KB),
    // so serving them directly is fine. On a paid plan, set IMAGES_OPTIMIZED=true
    // to get per-device resizing back.
    unoptimized: process.env.IMAGES_OPTIMIZED !== 'true',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Supabase Storage (admin/product/treatment image uploads) — without this,
      // any DB-stored Storage image URL would throw at render and 500 the page.
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async redirects() {
    return [{ source: '/staff/login', destination: '/frontdesk', permanent: true }];
  },
};

export default nextConfig;
