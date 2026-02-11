'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-4 py-8 md:py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/Swastika%20logo.png" 
                alt="Swastika Infrastructures" 
                width={28} 
                height={28} 
                className="h-7 w-7 object-contain"
              />
              <span className="font-display text-lg font-bold">Swastika Infrastructures</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 max-w-xs">
              Your trusted partner in real estate infrastructure.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/plots" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Get in Touch</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+919827006656" className="hover:text-primary-foreground transition-colors">
                  +91 98270 06656
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@swastikainfra.in" className="hover:text-primary-foreground transition-colors">
                  info@swastikainfra.in
                </a>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-primary-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-primary-foreground/60">
            <p>© 2026 Swastika Infrastructures. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-primary-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
