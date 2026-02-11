import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="text-center px-4 py-16">
        <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Search className="h-16 w-16 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flexcol sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/plots">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
