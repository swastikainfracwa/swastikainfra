import type { MetadataRoute } from 'next';
import { mockProperties } from '@/lib/mockData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://swastikainfra.in';

  // Static routes
  const routes = ['', '/plots', '/about', '/contact', '/login', '/signup'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic property routes
  const propertyRoutes = mockProperties.map((property) => ({
    url: `${baseUrl}/plots/${property.seoSlug}`,
    lastModified: new Date(property.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...routes, ...propertyRoutes];
}
