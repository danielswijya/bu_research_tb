import React from 'react';
import { GridDotBackground } from '@/components/ui/grid-dot-background';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Spotlight } from '@/components/ui/spotlight';

export default function DashboardLayout({ children }) {
  return (
    <GridDotBackground className="min-h-[calc(100vh-4rem)]">
      <div className="relative overflow-hidden">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-40" fill="#0d9488" />
        <BackgroundBeams className="opacity-50" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </GridDotBackground>
  );
}
