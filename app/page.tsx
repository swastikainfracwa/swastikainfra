'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, BadgeCheck, TrendingUp, MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import type { Property } from '@/types';

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [verifiedProperties, setVerifiedProperties] = useState<Property[]>([]);
  const [nearbyProperties, setNearbyProperties] = useState<(Property & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied' | 'dismissed'>('prompt');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch all properties from database (both verified and pending)
        const response = await fetch('/api/properties');
        const data = await response.json();
        
        if (data.properties) {
          // Take first 6 as featured
          setFeaturedProperties(data.properties.slice(0, 6));
          // Take next 6 as recent listings
          setVerifiedProperties(data.properties.slice(6, 12));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();

    // Check if user has previously granted/denied location permission
    const savedPermission = localStorage.getItem('locationPermission');
    if (savedPermission === 'dismissed') {
      setLocationPermission('dismissed');
    } else if (savedPermission === 'denied') {
      setLocationPermission('denied');
    }
  }, []);

  // Request location and fetch nearby properties
  const requestLocationAndFetchNearby = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setNearbyLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationPermission('granted');
        localStorage.setItem('locationPermission', 'granted');

        try {
          const response = await fetch(
            `/api/properties/nearby?latitude=${latitude}&longitude=${longitude}&radius=50`
          );
          const data = await response.json();

          if (data.properties) {
            setNearbyProperties(data.properties.slice(0, 6)); // Show top 6 nearest
          }
        } catch (error) {
          console.error('Error fetching nearby properties:', error);
        } finally {
          setNearbyLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
        localStorage.setItem('locationPermission', 'denied');
        setNearbyLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  };

  const dismissLocationPrompt = () => {
    setLocationPermission('dismissed');
    localStorage.setItem('locationPermission', 'dismissed');
  };

  const stats = [
    { value: '500+', label: 'Properties Listed' },
    { value: '200+', label: 'Verified Plots' },
    { value: '50+', label: 'Cities Covered' },
    { value: '1000+', label: 'Happy Buyers' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'All properties are thoroughly verified by our team for authenticity.',
    },
    {
      icon: BadgeCheck,
      title: 'Trusted Agents',
      description: 'Connect with verified real estate agents in your area.',
    },
    {
      icon: TrendingUp,
      title: 'Market Insights',
      description: 'Get the latest trends and pricing insights for your investment.',
    },
    {
      icon: MapPin,
      title: 'Wide Coverage',
      description: 'Find plots across major cities and upcoming locations in India.',
    },
  ];

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

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-success/5 py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Find Your Perfect
              <span className="text-primary block">Plot of Land</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover verified residential, commercial, and agricultural plots across India. 
              Your dream property is just a search away.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <SearchBar variant="hero" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Permission Prompt */}
      {locationPermission === 'prompt' && (
        <section className="py-6 bg-muted/50 border-b">
          <div className="container">
            <Alert className="relative">
              <Navigation className="h-5 w-5" />
              <AlertTitle className="mb-2">Discover Properties Near You</AlertTitle>
              <AlertDescription className="mb-4">
                Share your location to see properties available in your area. We'll show you the closest verified plots within 50km.
              </AlertDescription>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={requestLocationAndFetchNearby} disabled={nearbyLoading}>
                  {nearbyLoading ? 'Getting Location...' : 'Share My Location'}
                </Button>
                <Button variant="outline" onClick={dismissLocationPrompt}>
                  Maybe Later
                </Button>
              </div>
              <button
                onClick={dismissLocationPrompt}
                className="absolute top-3 right-3 p-1 rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        </section>
      )}

      {/* Properties Near You */}
      {locationPermission === 'granted' && nearbyProperties.length > 0 && (
        <section className="py-12 md:py-16 bg-success/5">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-success" />
                  Properties Near You
                </h2>
                <p className="text-muted-foreground mt-1">
                  Verified plots within 50km of your location
                </p>
              </div>
              <Link href={`/plots?nearMe=true&lat=${userLocation?.latitude}&lng=${userLocation?.longitude}`}>
                <Button variant="outline" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyLoading ? (
                <>
                  <PropertySkeleton />
                  <PropertySkeleton />
                  <PropertySkeleton />
                </>
              ) : (
                nearbyProperties.map((property) => (
                  <div key={property.id} className="relative">
                    <PropertyCard property={property} />
                    {property.distance !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-3 right-3 bg-success/90 text-white"
                      >
                        {property.distance.toFixed(1)} km away
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Properties */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Featured Properties
              </h2>
              <p className="text-muted-foreground mt-1">
                Hand-picked premium plots for you
              </p>
            </div>
            <Link href="/plots">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                <PropertySkeleton />
                <PropertySkeleton />
                <PropertySkeleton />
              </>
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No properties available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Why Choose Swastika Infrastructures?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We make finding and buying land simple, secure, and transparent.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Recent Listings
              </h2>
              <p className="text-muted-foreground mt-1">
                Explore our latest property listings
              </p>
            </div>
            <Link href="/plots">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                <PropertySkeleton />
                <PropertySkeleton />
                <PropertySkeleton />
              </>
            ) : verifiedProperties.length > 0 ? (
              verifiedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No properties available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to List Your Property?
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              Join thousands of property owners and agents who trust Swastika Infrastructures to connect 
              with genuine buyers. Get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  List Your Property <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-black hover:bg-primary-foreground/10 bg-white/90">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
