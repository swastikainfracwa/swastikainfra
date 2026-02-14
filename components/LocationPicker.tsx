'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

interface LocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(value || null);
  const { toast } = useToast();

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
      toast({
        title: 'Google Maps API Key Missing',
        description: 'Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    // @ts-expect-error - Loader.load() exists but types may not be up to date
    loader.load().then(() => {
      if (mapRef.current) {
        // Default location (India center) or use provided value
        const initialCenter = value 
          ? { lat: value.latitude, lng: value.longitude }
          : { lat: 20.5937, lng: 78.9629 }; // Center of India

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: value ? 15 : 5,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);

        // Add marker
        const markerInstance = new google.maps.Marker({
          map: mapInstance,
          position: initialCenter,
          draggable: true,
          title: 'Property Location',
        });

        setMarker(markerInstance);

        // Handle marker drag
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            reverseGeocode(position.lat(), position.lng());
          }
        });

        // Handle map click
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.setPosition(e.latLng);
            reverseGeocode(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          const autocompleteInstance = new google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              componentRestrictions: { country: 'in' }, // Restrict to India
              fields: ['address_components', 'geometry', 'formatted_address'],
            }
          );

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry?.location) {
              const location = place.geometry.location;
              mapInstance.setCenter(location);
              mapInstance.setZoom(15);
              markerInstance.setPosition(location);
              
              const addressComponents = place.address_components || [];
              const city = extractAddressComponent(addressComponents, 'locality') || 
                          extractAddressComponent(addressComponents, 'administrative_area_level_2');
              const state = extractAddressComponent(addressComponents, 'administrative_area_level_1');

              const locationData: LocationData = {
                address: place.formatted_address || '',
                latitude: location.lat(),
                longitude: location.lng(),
                city: city || '',
                state: state || '',
              };

              setCurrentLocation(locationData);
              onChange(locationData);
            }
          });

          setAutocomplete(autocompleteInstance);
        }

        setIsLoading(false);
      }
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
      toast({
        title: 'Failed to Load Map',
        description: 'Could not initialize Google Maps. Please check your API key.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addressComponents = results[0].address_components;
        const city = extractAddressComponent(addressComponents, 'locality') || 
                    extractAddressComponent(addressComponents, 'administrative_area_level_2');
        const state = extractAddressComponent(addressComponents, 'administrative_area_level_1');

        const locationData: LocationData = {
          address: results[0].formatted_address,
          latitude: lat,
          longitude: lng,
          city: city || '',
          state: state || '',
        };

        setCurrentLocation(locationData);
        onChange(locationData);

        if (searchInputRef.current) {
          searchInputRef.current.value = results[0].formatted_address;
        }
      } else {
        toast({
          title: 'Geocoding Failed',
          description: 'Could not retrieve address for this location',
          variant: 'destructive',
        });
      }
    });
  }, [map, onChange, toast]);

  // Extract specific component from address
  const extractAddressComponent = (
    components: google.maps.GeocoderAddressComponent[],
    type: string
  ): string | undefined => {
    const component = components.find((c) => c.types.includes(type));
    return component?.long_name;
  };

  // Get current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map && marker) {
          const location = { lat: latitude, lng: longitude };
          map.setCenter(location);
          map.setZoom(15);
          marker.setPosition(location);
          reverseGeocode(latitude, longitude);
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location Access Denied',
          description: 'Please allow location access to use this feature',
          variant: 'destructive',
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[400px] bg-muted">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Search and Current Location Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="pl-10"
              defaultValue={value?.address || ''}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Map Container */}
        <Card>
          <div 
            ref={mapRef} 
            className="w-full h-[400px] rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </Card>

        {/* Selected Location Info */}
        {currentLocation && (
          <Card className="p-4 bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium">Selected Location:</p>
              <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Lat: {currentLocation.latitude.toFixed(6)}</span>
                <span>Lng: {currentLocation.longitude.toFixed(6)}</span>
              </div>
              {currentLocation.city && (
                <div className="flex gap-2 text-xs text-muted-foreground pt-1">
                  <span>City: {currentLocation.city}</span>
                  {currentLocation.state && <span>• State: {currentLocation.state}</span>}
                </div>
              )}
            </div>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Click on the map or drag the marker to set the exact property location
        </p>
      </div>
    </div>
  );
};
