'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, Maximize, Calendar, Phone, User, ChevronLeft, 
  ChevronRight, Share2, Heart, MessageCircle, Lock
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PropertyDetailClientProps = {
  property: Property;
  propertyTypeColors: Record<string, string>;
};

export default function PropertyDetailClient({ property, propertyTypeColors }: PropertyDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [isContentUnlocked, setIsContentUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Check localStorage for global unlock status on mount
  useEffect(() => {
    const unlocked = localStorage.getItem('swastika-properties-unlocked');
    if (unlocked === 'true') {
      setIsContentUnlocked(true);
      setHasSubmittedLead(true);
    }
  }, []);

  // Handle successful lead submission - unlock ALL properties globally
  const handleLeadSuccess = () => {
    setHasSubmittedLead(true);
    setIsContentUnlocked(true);
    localStorage.setItem('swastika-properties-unlocked', 'true');
  };

  // Auto-submit lead for authenticated users
  const handleUnlockClick = async () => {
    if (isAuthenticated && user && user.phone) {
      // User is logged in with phone number, auto-submit lead with their info
      setIsUnlocking(true);
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId: property.id,
            propertyTitle: property.title,
            name: user.name,
            phone: user.phone,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit lead');
        }

        toast({
          title: 'Details Unlocked!',
          description: 'You can now view full details of all properties.',
        });

        handleLeadSuccess();
      } catch (error) {
        console.error('Lead submission error:', error);
        toast({
          title: 'Error',
          description: 'Failed to unlock details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsUnlocking(false);
      }
    } else {
      // User is not logged in or doesn't have phone number, show modal
      setIsLeadModalOpen(true);
    }
  };

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = property.youtubeVideoUrl ? getYouTubeVideoId(property.youtubeVideoUrl) : null;

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
              <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
                <img
                  src={property.images[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="h-full w-full object-contain object-center"
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
                          'flex-shrink-0 w-20 h-16 rounded-lg border-2 overflow-hidden transition-colors bg-muted/40',
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      )}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                        <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain object-center" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Property Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  {/* Blur overlay when locked */}
                  {!isContentUnlocked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-background/30 rounded-lg">
                      <Button 
                        size="lg" 
                        className="gap-2"
                        onClick={handleUnlockClick}
                        disabled={isUnlocking}
                      >
                        <Lock className="h-4 w-4" />
                        {isUnlocking ? 'Unlocking...' : 'Unlock Full Details'}
                      </Button>
                    </div>
                  )}
                  
                  <div className={cn("space-y-6", !isContentUnlocked && "blur-sm select-none pointer-events-none")}>
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

                  {/* YouTube Video Section */}
                  {youtubeVideoId && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="font-display text-xl font-semibold mb-3">Video Tour</h2>
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                            title="Property Video Tour"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    </>
                  )}
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
                    onClick={handleUnlockClick}
                    disabled={hasSubmittedLead || isUnlocking}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isUnlocking ? 'Submitting...' : hasSubmittedLead ? 'Interest Submitted' : 'I\'m Interested'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    size="lg"
                    asChild
                  >
                    <a href="tel:+919827006656">
                      <Phone className="h-4 w-4" />
                      Call Now
                    </a>
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="flex-1">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="flex-1">
                      <Share2 className="h-4 w-4" />
                    </Button>
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
        onSuccess={handleLeadSuccess}
      />
    </main>
  );
}
