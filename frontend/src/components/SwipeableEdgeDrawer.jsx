import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '../../lib/supabaseClient';
import { Chip, Typography } from '@mui/material';
import SidebarFilterControls from './SidebarFilterControls';
import EntryConfirmationDialog from './EntryConfirmationDialog';
import LocationResultCard from './LocationResultCard';
import { siteJoinKey } from '../utils/siteJoinKey';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { cn } from '@/lib/utils';

const SEARCH_PLACEHOLDERS = [
  'Search locations…',
  'Filter by zona…',
  'Filter by district…',
];

export default function SidebarSelector({
  onConfirm,
  siteData,
  recommendationsByKey,
  onFilter,
  selectedScreeningIds,
  setSelectedScreeningIds,
  selectedMarkerKey,
  setSelectedMarkerKey,
  setHighlightedMarkerKey,
  onFocusSite,
}) {
  const [flattenedEntries, setFlattenedEntries] = useState([]);
  const [zoneNames, setZoneNames] = useState(new Map());
  const [pulseId, setpulseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDistrict, setActiveDistrict] = useState('');
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [entriesToConfirm, setEntriesToConfirm] = useState([]);
  const listParentRef = useRef(null);

  const [filters, setFilters] = useState({
    selectedTypes: [],
    selectedZonaIds: [],
    rankByScreened: false,
    rankByDiagnosed: false,
    rankByYield: false,
    yieldRange: [0, 100],
    nameTokens: [],
    zonaIdTokens: [],
    locationIdTokens: [],
    districtTokens: [],
  });

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        const map = new Map(
          geojson.features.map((f) => [
            Math.floor(f.properties.Zona_ID),
            f.properties.Zone_Nam_1,
          ])
        );
        setZoneNames(map);
      })
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const hasBanditRanks = useMemo(
    () => (recommendationsByKey?.size ?? 0) > 0,
    [recommendationsByKey]
  );

  const latestSiteData = useMemo(() => {
    const uniqueLocations = new Map();

    siteData.forEach((entry) => {
      const methodsArray = Array.isArray(entry.methods)
        ? entry.methods
        : typeof entry.methods === 'string'
          ? entry.methods.split(',').map((m) => m.trim())
          : entry.methods instanceof Set
            ? Array.from(entry.methods)
            : [];

      if (methodsArray.some((method) => String(method).toLowerCase() === 'na')) {
        return;
      }

      let newDate;
      if (entry.Date && typeof entry.Date === 'string' && entry.Date.toLowerCase() !== 'na') {
        newDate = new Date(entry.Date);
      } else {
        return;
      }
      if (Number.isNaN(newDate.getTime())) return;

      const lat = entry.lat ?? 'unknown_lat';
      const lon = entry.lon ?? 'unknown_lon';
      const locationKey = `${(entry.location_name || 'Unknown').toLowerCase().trim()}|${(entry.Zona_name || 'Unknown').toLowerCase().trim()}|${lat}|${lon}`;
      const joinKey =
        entry.joinKey ||
        siteJoinKey(entry.location_name, entry.Zona_name, entry.District);
      const bandit = recommendationsByKey?.get(joinKey);
      const enriched = {
        ...entry,
        joinKey,
        banditRank: bandit?.rank ?? entry.banditRank ?? null,
        banditPriority: bandit?.priority ?? entry.banditPriority ?? null,
      };

      const existing = uniqueLocations.get(locationKey);
      if (!existing || newDate > new Date(existing.Date)) {
        uniqueLocations.set(locationKey, enriched);
      }
    });

    return Array.from(uniqueLocations.values());
  }, [siteData, recommendationsByKey]);

  const availableDistricts = useMemo(
    () => [...new Set(siteData.map((s) => s.District).filter(Boolean))].sort(),
    [siteData]
  );

  const availableSiteTypes = useMemo(() => {
    const allMethods = siteData.flatMap((s) => {
      if (s.methods instanceof Set) return Array.from(s.methods);
      if (Array.isArray(s.methods)) return s.methods;
      if (typeof s.methods === 'string') return s.methods.split(',').map((m) => m.trim());
      return [];
    });
    return Array.from(
      new Set(allMethods.filter((m) => typeof m === 'string' && m.toLowerCase() !== 'na'))
    );
  }, [siteData]);

  useEffect(() => {
    if (!latestSiteData.length) return;

    const [minYield, maxYield] = filters.yieldRange;
    const q = searchQuery.trim().toLowerCase();

    const filtered = latestSiteData.filter((site) => {
      const yieldRatio =
        site.total_screened > 0
          ? (site.total_diagnosed / site.total_screened) * 100
          : 0;
      const inYieldRange = yieldRatio >= minYield && yieldRatio <= maxYield;

      const siteMethodsArray =
        site.methods instanceof Set
          ? Array.from(site.methods)
          : Array.isArray(site.methods)
            ? site.methods
            : typeof site.methods === 'string'
              ? site.methods.split(',').map((m) => m.trim())
              : [];

      const siteTypeMatch =
        filters.selectedTypes.length === 0 ||
        filters.selectedTypes.some((selectedType) =>
          siteMethodsArray.some((siteMethod) =>
            String(siteMethod).toLowerCase().includes(selectedType.toLowerCase())
          )
        );

      const zonaIdStr = site.Zona_ID?.toString() || '';
      const zoneName = (site.Zona_name || '').toLowerCase();
      const locationName = (site.location_name || '').toLowerCase();
      const district = (site.District || '').toLowerCase();

      const nameMatch =
        filters.nameTokens.length === 0 ||
        filters.nameTokens.some((token) => zoneName.includes(token.toLowerCase()));

      const zonaIdMatch =
        filters.zonaIdTokens.length === 0 ||
        filters.zonaIdTokens.some((token) => zonaIdStr.startsWith(token));

      const districtMatch =
        filters.districtTokens.length === 0 ||
        filters.districtTokens.some((token) =>
          (site.District || '').toLowerCase().includes(token.toLowerCase())
        );

      const chipDistrictMatch =
        !activeDistrict || site.District === activeDistrict;

      const searchMatch =
        !q ||
        locationName.includes(q) ||
        zoneName.includes(q) ||
        district.includes(q) ||
        zonaIdStr.includes(q);

      return (
        inYieldRange &&
        siteTypeMatch &&
        nameMatch &&
        zonaIdMatch &&
        districtMatch &&
        chipDistrictMatch &&
        searchMatch
      );
    });

    const ranked = [...filtered];
    if (filters.rankByScreened) {
      ranked.sort((a, b) => b.total_screened - a.total_screened);
    } else if (filters.rankByDiagnosed) {
      ranked.sort((a, b) => b.total_diagnosed - a.total_diagnosed);
    } else if (filters.rankByYield) {
      ranked.sort(
        (a, b) =>
          (b.total_diagnosed / b.total_screened || 0) -
          (a.total_diagnosed / a.total_screened || 0)
      );
    } else if (hasBanditRanks) {
      ranked.sort((a, b) => {
        const ar = a.banditRank == null ? Number.POSITIVE_INFINITY : a.banditRank;
        const br = b.banditRank == null ? Number.POSITIVE_INFINITY : b.banditRank;
        if (ar !== br) return ar - br;
        return (b.banditPriority ?? -1) - (a.banditPriority ?? -1);
      });
    } else {
      ranked.sort(
        (a, b) =>
          (b.total_diagnosed / b.total_screened || 0) -
          (a.total_diagnosed / a.total_screened || 0)
      );
    }

    setFlattenedEntries(ranked);
    onFilter?.(ranked);
  }, [
    latestSiteData,
    filters,
    zoneNames,
    hasBanditRanks,
    searchQuery,
    activeDistrict,
    onFilter,
  ]);

  const rowVirtualizer = useVirtualizer({
    count: flattenedEntries.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 168,
    overscan: 8,
  });

  useEffect(() => {
    if (!selectedMarkerKey || flattenedEntries.length === 0) return;
    const index = flattenedEntries.findIndex((e) => e.markerKey === selectedMarkerKey);
    if (index < 0) return;
    rowVirtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
    const t = setTimeout(() => {
      setpulseId(selectedMarkerKey);
      setTimeout(() => setpulseId(null), 1600);
    }, 200);
    return () => clearTimeout(t);
  }, [selectedMarkerKey, flattenedEntries, rowVirtualizer]);

  const handleInitiateConfirmation = () => {
    const selectedFullEntries = selectedScreeningIds
      .map((markerKey) => flattenedEntries.find((e) => e.markerKey === markerKey))
      .filter(Boolean);
    setEntriesToConfirm(selectedFullEntries);
    setOpenConfirmationDialog(true);
  };

  const handleConfirmSelectionsInDialog = async (confirmedSelections) => {
    if (confirmedSelections.length === 0) return;
    const { data, error } = await supabase
      .from('tickets')
      .insert(confirmedSelections)
      .select();

    if (error) console.error('Ticket insert error:', error);
    else {
      console.log('Tickets inserted:', data);
      setSelectedScreeningIds([]);
      setEntriesToConfirm([]);
      setOpenConfirmationDialog(false);
      onConfirm?.();
    }
  };

  const toggleSelection = (markerKey) => {
    setSelectedScreeningIds((prev) =>
      prev.includes(markerKey)
        ? prev.filter((id) => id !== markerKey)
        : [...prev, markerKey]
    );
  };

  return (
    <aside
      className={cn(
        'fixed top-16 right-0 z-[1000] flex h-[calc(100vh-4rem)] w-[min(100vw,380px)] flex-col',
        'rounded-tl-2xl border-l border-slate-200 bg-white/95 shadow-[-8px_0_24px_rgba(15,23,42,0.08)] backdrop-blur'
      )}
    >
      <div className="space-y-3 border-b border-slate-100 px-3 pt-3 pb-2">
        <PlaceholdersAndVanishInput
          placeholders={SEARCH_PLACEHOLDERS}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSubmit={(e) => e.preventDefault()}
        />

        <div className="no-visible-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <Chip
            size="small"
            label="All districts"
            color={!activeDistrict ? 'primary' : 'default'}
            variant={!activeDistrict ? 'filled' : 'outlined'}
            onClick={() => setActiveDistrict('')}
          />
          {availableDistricts.map((d) => (
            <Chip
              key={d}
              size="small"
              label={d}
              color={activeDistrict === d ? 'primary' : 'default'}
              variant={activeDistrict === d ? 'filled' : 'outlined'}
              onClick={() => setActiveDistrict((prev) => (prev === d ? '' : d))}
            />
          ))}
        </div>

        <SidebarFilterControls
          filters={filters}
          setFilters={setFilters}
          availableSiteTypes={availableSiteTypes}
          availableDistricts={availableDistricts}
        />

        <div className="flex items-center justify-between px-0.5">
          <Typography variant="caption" color="text.secondary">
            {hasBanditRanks
              ? 'Sorted by recommended rank'
              : 'Sorted by yield (bandit ranks unavailable)'}
          </Typography>
          <Typography variant="subtitle2" className="!text-teal-800">
            {flattenedEntries.length} sites
          </Typography>
        </div>
      </div>

      <div ref={listParentRef} className="min-h-0 flex-1 overflow-y-auto px-2 pt-2">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const entry = flattenedEntries[virtualRow.index];
            return (
              <div
                key={entry.markerKey}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  pulseId === entry.markerKey && 'animate-pulse'
                )}
              >
                <LocationResultCard
                  entry={entry}
                  isSelected={selectedScreeningIds.includes(entry.markerKey)}
                  isHighlighted={selectedMarkerKey === entry.markerKey}
                  onToggle={toggleSelection}
                  onFocus={(site) => {
                    setSelectedMarkerKey(site.markerKey);
                    setHighlightedMarkerKey(site.markerKey);
                    onFocusSite?.(site);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white px-3 py-3">
        <p className="mb-2 text-center text-xs text-slate-500">
          {selectedScreeningIds.length} selected — confirm to create tickets
        </p>
        <MovingBorderButton
          disabled={selectedScreeningIds.length === 0}
          onClick={handleInitiateConfirmation}
          containerClassName={cn(
            'h-11 w-full',
            selectedScreeningIds.length === 0 && 'pointer-events-none opacity-50'
          )}
          className="bg-teal-800"
        >
          Confirm Selection
        </MovingBorderButton>
      </div>

      <EntryConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        selectedEntries={entriesToConfirm}
        onConfirmSelection={handleConfirmSelectionsInDialog}
      />
    </aside>
  );
}
