import type { MetadataRoute } from 'next'
import { CLINIC_DOMAIN } from '@/lib/clinic'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/console',
        '/doctor',
        '/product-management',
        '/agent',
        '/account',
        '/frontdesk',
        '/staff',
        '/studio',
        '/api',
        '/auth',
        '/cart',
        '/checkout',
        '/book/request',
        '/book/manage',
      ],
    },
    sitemap: `https://${CLINIC_DOMAIN}/sitemap.xml`,
  }
}
