/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Supabase Storage (admin/product/treatment image uploads) — without this,
      // any DB-stored Storage image URL would throw at render and 500 the page.
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
