import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';
import Providers from './providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Swastika Infrastructures - Perfect Prosperity',
  description: 'Discover verified residential, commercial, and agricultural plots across India. Swastika Infrastructures - Perfect Prosperity, connecting buyers with trusted property owners and agents.',
  keywords: 'plots for sale, land for sale, residential plots, commercial plots, agricultural land, real estate India, Swastika Infrastructures',
  authors: [{ name: 'Swastika Infrastructures' }],
  openGraph: {
    title: 'Swastika Infrastructures - Perfect Prosperity',
    description: 'Discover verified plots across India. Connect with trusted property owners and agents.',
    type: 'website',
    siteName: 'Swastika Infrastructures',
    images: [
      {
        url: 'https://lovable.dev/opengraph-image-p98pqg.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swastika Infrastructures - Perfect Prosperity',
    description: 'Discover verified plots across India. Connect with trusted property owners and agents.',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  alternates: {
    canonical: 'https://swastikainfra.in',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
