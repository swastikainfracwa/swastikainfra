import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Maximize, Eye, Calendar, Phone, User, ChevronLeft, 
  ChevronRight, Share2, Heart, MessageCircle
} from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';
import PropertyDetailClient from './PropertyDetailClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatPlotSize } from '@/lib/mockData';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import type { Property } from '@/types';

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const supabase = await createAdminClient();
  
  // Try to find by seo_slug first
  let { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      agent:assigned_agent_id(name, phone)
    `)
    .eq('seo_slug', slug)
    .maybeSingle();

  // If not found by seo_slug, try by id (for UUID slugs)
  if (!property && !error) {
    const result = await supabase
      .from('properties')
      .select(`
        *,
        agent:assigned_agent_id(name, phone)
      `)
      .eq('id', slug)
      .maybeSingle();
    property = result.data;
    error = result.error;
  }

  if (error || !property) {
    return null;
  }

  // Transform database response to match Property interface
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    price: property.price,
    location: property.location,
    city: property.city,
    state: property.state,
    plotSize: property.plot_size,
    plotSizeUnit: property.plot_size_unit,
    propertyType: property.property_type,
    images: property.images || [],
    ownerId: property.owner_id,
    ownerName: property.owner_name,
    ownerPhone: property.owner_phone,
    verificationStatus: property.verification_status,
    verificationBadge: property.verification_badge,
    isFeatured: property.is_featured,
    isStaffCreated: property.is_staff_created,
    documentUploadCompleted: property.document_upload_completed,
    assignedAgentId: property.assigned_agent_id,
    assignedAgentName: property.agent?.name,
    assignedAgentPhone: property.agent?.phone,
    seoSlug: property.seo_slug,
    views: property.views || 0,
    createdAt: new Date(property.created_at),
    updatedAt: new Date(property.updated_at),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  
  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  return {
    title: `${property.title} | Swastika Infrastructures`,
    description: property.description.substring(0, 160),
    openGraph: {
      title: property.title,
      description: property.description,
      images: property.images[0] ? [{ url: property.images[0] }] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const propertyTypeColors = {
    residential: 'bg-primary/10 text-primary',
    commercial: 'bg-warning/10 text-warning',
    agricultural: 'bg-success/10 text-success',
    industrial: 'bg-muted text-muted-foreground',
  };

  return (
    <PropertyDetailClient property={property} propertyTypeColors={propertyTypeColors} />
  );
}
