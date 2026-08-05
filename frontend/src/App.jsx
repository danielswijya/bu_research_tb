import React from 'react';
import { Box } from '@mui/material';
import MapPage from './pages/MapPage';
import TicketsPage from './pages/Tickets';
import { FloatingNav } from '@/components/ui/floating-navbar';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';

const NAV_TABS = [
  { title: 'Map', value: 'map' },
  { title: 'Dashboard', value: 'dashboard' },
];

export default function App() {
  const [tab, setTab] = React.useState('map');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <FloatingNav
        brand={
          <>
            <Box
              component="img"
              src="/images/bu-sph.png"
              alt="BU School of Public Health"
              sx={{ height: 44, width: 'auto', borderRadius: 1 }}
            />
            <div className="min-w-0">
              <TextGenerateEffect
                words="TB Tracker"
                className="text-lg leading-tight sm:text-xl"
                duration={0.35}
                filter={false}
              />
              <p className="truncate text-xs text-slate-500">
                BU School of Public Health
              </p>
            </div>
          </>
        }
      >
        <AnimatedTabs tabs={NAV_TABS} activeValue={tab} onChange={setTab} />
      </FloatingNav>

      <main className="relative flex-1">
        {tab === 'map' && <MapPage />}
        {tab === 'dashboard' && <TicketsPage />}
      </main>
    </div>
  );
}
