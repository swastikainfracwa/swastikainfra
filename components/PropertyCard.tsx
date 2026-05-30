'use client';

import Link from 'next/link';
import { MapPin, Maximize, Eye } from 'lucide-react';
import type { Property } from '@/types';
import { formatPrice, formatPlotSize } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VerificationBadge from './VerificationBadge';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

const propertyTypeColors = {
  residential: 'bg-primary/10 text-primary border-primary/20',
  commercial: 'bg-warning/10 text-warning border-warning/20',
  agricultural: 'bg-success/10 text-success border-success/20',
  industrial: 'bg-muted text-muted-foreground border-muted',
};

export default function PropertyCard({ property, className }: PropertyCardProps) {
  // Get the first image or use a placeholder
  const imageSrc = property.images && property.images.length > 0 
    ? property.images[0] 
    : 'https://placehold.co/600x400/e5e7eb/6b7280?text=No+Image';

  return (
    <Link href={`/plots/${property.seoSlug}`}>
      <Card className={cn(
        'group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        className
      )}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
          <img
            src={imageSrc}
            alt={property.title}
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.currentTarget.src = 'https://placehold.co/600x400/e5e7eb/6b7280?text=No+Image';
            }}
          />
          
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {property.isFeatured && (
              <Badge className="bg-warning text-warning-foreground border-0">
                Featured
              </Badge>
            )}
            {property.propertyType && (
              <Badge className={cn('border', propertyTypeColors[property.propertyType])}>
                {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
              </Badge>
            )}
          </div>
          
          {/* Verification Badge */}
          {property.verificationBadge && (
            <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full p-1.5">
              <VerificationBadge badge={property.verificationBadge} size="md" />
            </div>
          )}
          
          {/* Price Tag */}
          <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-sm rounded-md px-3 py-1.5">
            <span className="font-display text-lg font-bold text-foreground">
              {formatPrice(property.price)}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{property.location}, {property.city}</span>
          </div>

          {/* Details Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Maximize className="h-4 w-4" />
              <span>{formatPlotSize(property.plotSize, property.plotSizeUnit)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{property.views} views</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
