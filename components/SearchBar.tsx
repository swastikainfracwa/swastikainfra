'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, MapPin, IndianRupee, Maximize, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PropertyType } from '@/types';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export default function SearchBar({ variant = 'compact', className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(
    (searchParams.get('type') as PropertyType) || ''
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minSize, setMinSize] = useState(searchParams.get('minSize') || '');
  const [maxSize, setMaxSize] = useState(searchParams.get('maxSize') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');

  // Debounce text inputs (location, prices, sizes) by 500ms
  const [debouncedLocation] = useDebounce(location, 500);
  const [debouncedMinPrice] = useDebounce(minPrice, 500);
  const [debouncedMaxPrice] = useDebounce(maxPrice, 500);
  const [debouncedMinSize] = useDebounce(minSize, 500);
  const [debouncedMaxSize] = useDebounce(maxSize, 500);

  // Auto-apply filters when debounced values or instant values change
  useEffect(() => {
    // Only auto-apply filters if we're already on the plots page
    if (!pathname.startsWith('/plots')) {
      return;
    }

    const params = new URLSearchParams();
    if (debouncedLocation) params.set('location', debouncedLocation);
    if (propertyType) params.set('type', propertyType);
    if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
    if (debouncedMinSize) params.set('minSize', debouncedMinSize);
    if (debouncedMaxSize) params.set('maxSize', debouncedMaxSize);
    if (verifiedOnly) params.set('verified', 'true');
    
    router.push(`/plots?${params.toString()}`, { scroll: false });
  }, [debouncedLocation, propertyType, debouncedMinPrice, debouncedMaxPrice, debouncedMinSize, debouncedMaxSize, verifiedOnly, router, pathname]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (propertyType) params.set('type', propertyType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minSize) params.set('minSize', minSize);
    if (maxSize) params.set('maxSize', maxSize);
    if (verifiedOnly) params.set('verified', 'true');
    
    router.push(`/plots?${params.toString()}`);
  };

  const isHero = variant === 'hero';

  return (
    <div className={cn(
      'w-full',
      isHero ? 'bg-card/95 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl' : 'bg-card rounded-lg p-3 shadow-sm border',
      className
    )}>
      <div className={cn(
        'flex flex-col gap-3',
        isHero ? 'md:flex-row md:items-end' : 'sm:flex-row sm:items-center'
      )}>
        {/* Location Input */}
        <div className={cn('flex-1', isHero && 'md:min-w-[200px]')}>
          {isHero && <Label className="text-xs text-muted-foreground mb-1.5 block">Location</Label>}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by city or area..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Property Type Select */}
        <div className={cn(isHero ? 'md:w-[180px]' : 'sm:w-[160px]')}>
          {isHero && <Label className="text-xs text-muted-foreground mb-1.5 block">Property Type</Label>}
          <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range - Hero only inline */}
        {isHero && (
          <div className="hidden lg:flex items-end gap-2">
            <div className="w-[120px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Min Price (₹/sq ft)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Min"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <span className="text-muted-foreground pb-2">-</span>
            <div className="w-[120px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Max Price (₹/sq ft)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Max"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        )}

        {/* More Filters Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size={isHero ? 'default' : 'sm'} className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
              <SheetDescription>
                Refine your property search with additional filters.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label>Price Range (₹/sq ft)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Plot Size */}
              <div className="space-y-3">
                <Label>Plot Size (Sq Yd)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minSize}
                    onChange={(e) => setMinSize(e.target.value)}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxSize}
                    onChange={(e) => setMaxSize(e.target.value)}
                  />
                </div>
              </div>

              {/* Verified Only */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Verified Properties Only</Label>
                  <p className="text-xs text-muted-foreground">Show only verified listings</p>
                </div>
                <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
              </div>

              <p className="text-xs text-muted-foreground text-center pt-2">
                Filters apply automatically as you change them
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Button - Now optional for immediate search */}
        <Button onClick={handleSearch} size={isHero ? 'lg' : 'default'} variant="default" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
};
