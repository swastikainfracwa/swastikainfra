'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type ActionDialogBrandProps = {
  className?: string;
};

export function ActionDialogBrand({ className }: ActionDialogBrandProps) {
  return (
    <div className={cn('flex justify-center pb-4', className)}>
      <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
        <Image
          src="/card%20logo.png"
          alt="Swastika Infra"
          width={240}
          height={80}
          className="h-12 w-auto object-contain sm:h-14"
          priority
        />
      </div>
    </div>
  );
}