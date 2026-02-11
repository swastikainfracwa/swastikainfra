'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, Maximize, Calendar, Phone, User, ChevronLeft, 
  ChevronRight, Share2, Heart, MessageCircle
} from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatPlotSize } from '@/lib/mockData';
import type { Property } from '@/types';
import { cn } from '@/lib/utils';

type PropertyDetailClientProps = {
  property: Property;
  propertyTypeColors: Record<string, string>;
};

export default function PropertyDetailClient({ property, propertyTypeColors }: PropertyDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <main className="flex-1 bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/plots" className="text-muted-foreground hover:text-foreground">Plots</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground truncate max-w-[200px]">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                <img
                  src={property.images[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                
                {property.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {property.images.map((_, index) => (
                        <button
                          key={index}
                          className={cn(
                            'h-2 w-2 rounded-full transition-colors',
                            index === currentImageIndex ? 'bg-primary' : 'bg-primary/30'
                          )}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.isFeatured && (
                    <Badge className="bg-warning text-warning-foreground">Featured</Badge>
                  )}
                  <Badge className={propertyTypeColors[property.propertyType]}>
                    {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                  </Badge>
                </div>

                {property.verificationBadge && (
                  <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <VerificationBadge badge={property.verificationBadge} showLabel size="md" />
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {property.images.map((img, index) => (
                    <button
                      key={index}
                      className={cn(
                        'flex-shrink-0 w-20 h-16 rounded-lg border-2 overflow-hidden transition-colors',
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      )}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Property Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{property.location}, {property.city}, {property.state}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Maximize className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Plot Size</div>
                        <div className="font-semibold">{formatPlotSize(property.plotSize, property.plotSizeUnit)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Listed</div>
                        <div className="font-semibold">
                          {new Date(property.createdAt).toLocaleDateString('en-IN', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>

                    {property.verificationBadge && (
                      <div className="flex items-center gap-2">
                        <VerificationBadge badge={property.verificationBadge} showLabel size="lg" />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-3xl font-display font-bold text-primary mb-6">
                  {formatPrice(property.price)}
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={() => setIsLeadModalOpen(true)}
                    disabled={hasSubmittedLead}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {hasSubmittedLead ? 'Interest Submitted' : 'I\'m Interested'}
                  </Button>
                  
                  {property.assignedAgentPhone && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      size="lg"
                      asChild
                    >
                      <a href={`tel:${property.assignedAgentPhone}`}>
                        <Phone className="h-4 w-4" />
                        Call Agent
                      </a>
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="flex-1">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="flex-1">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{property.assignedAgentName || property.ownerName}</div>
                      {property.assignedAgentPhone && (
                        <div className="text-sm text-muted-foreground">{property.assignedAgentPhone}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        onSuccess={() => setHasSubmittedLead(true)}
      />
    </main>
  );
}
