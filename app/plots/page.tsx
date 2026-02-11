'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

export default function PropertyListingPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Build query string from search params for API
        const params = new URLSearchParams();
        const location = searchParams.get('location');
        const type = searchParams.get('type');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const verified = searchParams.get('verified');
        
        if (location) params.append('location', location);
        if (type && type !== 'all') params.append('propertyType', type);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (verified) params.append('verified', verified);
        
        const url = params.toString() 
          ? `/api/properties?${params.toString()}`
          : '/api/properties';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.properties) {
          setProperties(data.properties);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  // Client-side filtering for params not supported by API (size and featured)
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Size range filter (not supported by API)
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');
    if (minSize) {
      result = result.filter((p) => p.plotSize >= parseInt(minSize));
    }
    if (maxSize) {
      result = result.filter((p) => p.plotSize <= parseInt(maxSize));
    }

    // Featured filter (not supported by API)
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      result = result.filter((p) => p.isFeatured);
    }

    return result;
  }, [searchParams, properties]);

  const PropertySkeleton = () => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );

  const getFilterSummary = () => {
    const parts: string[] = [];
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const verified = searchParams.get('verified');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');

    if (location) parts.push(`in "${location}"`);
    if (type && type !== 'all') parts.push(`${type}`);
    if (verified === 'true') parts.push('verified');
    if (featured === 'true') parts.push('featured');
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        parts.push(`₹${parseInt(minPrice).toLocaleString('en-IN')} - ₹${parseInt(maxPrice).toLocaleString('en-IN')}`);
      } else if (minPrice) {
        parts.push(`above ₹${parseInt(minPrice).toLocaleString('en-IN')}`);
      } else if (maxPrice) {
        parts.push(`below ₹${parseInt(maxPrice).toLocaleString('en-IN')}`);
      }
    }
    if (minSize || maxSize) {
      if (minSize && maxSize) {
        parts.push(`${minSize}-${maxSize} sq.yd`);
      } else if (minSize) {
        parts.push(`above ${minSize} sq.yd`);
      } else if (maxSize) {
        parts.push(`below ${maxSize} sq.yd`);
      }
    }

    return parts.length > 0 ? parts.join(', ') : 'all';
  };

  return (
    <main className="flex-1 bg-muted/30">
      {/* Search Section */}
      <section className="bg-card border-b py-6">
        <div className="container">
          <SearchBar variant="compact" />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {filteredProperties.length} Properties Found
              </h1>
              <p className="text-sm text-muted-foreground">
                Showing {getFilterSummary()} properties
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Properties Grid/List */}
          {loading ? (
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertySkeleton key={i} />
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                No Properties Found
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your filters or search criteria to find more properties.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
