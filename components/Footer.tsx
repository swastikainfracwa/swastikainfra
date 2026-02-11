'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  
  // Determine redirect URL for "List Your Property" based on login status
  const listPropertyUrl = user ? '/dashboard' : '/signup';

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-4 py-10 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/Swastika%20logo.png" 
                alt="Swastika Infrastructures" 
                width={32} 
                height={32} 
                className="h-8 w-8 object-contain brightness-0 invert"
              />
              <span className="font-display text-xl font-bold">Swastika Infrastructures</span>
            </Link>
            <p className="text-sm text-primary-foreground/80">
              Perfect Prosperity - Your trusted partner in real estate infrastructure.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/plots" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Browse Plots
                </Link>
              </li>
              <li>
                <Link href="/plots?type=residential" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Residential Plots
                </Link>
              </li>
              <li>
                <Link href="/plots?type=commercial" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Commercial Plots
                </Link>
              </li>
              <li>
                <Link href="/plots?verified=true" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Verified Properties
                </Link>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold">For Owners</h3>
            <ul className="space-y-2">
              <li>
                <Link href={listPropertyUrl} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>123 Business Park, Sector 45, Gurgaon, Haryana 122003</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+91 98270 06656</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@swastikainfra.in</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground transition-colors"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60 text-center sm:text-left">
              © 2026 Swastika Infrastructures. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
