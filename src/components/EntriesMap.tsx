import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Calendar, Navigation } from 'lucide-react';
import type { JournalEntry } from '../types';
import { AnimeStickerBadge } from './AnimeStickers';

interface EntriesMapProps {
  entries: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
}

export const EntriesMap: React.FC<EntriesMapProps> = ({ entries }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Filter entries with valid coordinates
  const geotaggedEntries = entries.filter(
    (e) => typeof e.location?.latitude === 'number' && typeof e.location?.longitude === 'number'
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (San Francisco or first entry's coordinates)
    const defaultCenter: [number, number] =
      geotaggedEntries.length > 0
        ? [geotaggedEntries[0].location!.latitude!, geotaggedEntries[0].location!.longitude!]
        : [37.7749, -122.4194];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: geotaggedEntries.length > 0 ? 13 : 11,
      zoomControl: true,
    });

    // Clean, natural voyager tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when geotagged entries change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (geotaggedEntries.length === 0) return;

    const bounds = L.latLngBounds([]);

    geotaggedEntries.forEach((entry) => {
      const lat = entry.location!.latitude!;
      const lng = entry.location!.longitude!;
      bounds.extend([lat, lng]);

      // Determine marker color from mood (Naruto Yellow/Orange Palette)
      const mood = entry.moodScore ?? 7;
      let markerBg = '#EA580C'; // Vibrant Naruto Orange
      if (mood >= 8) markerBg = '#EA580C'; // Chakra flame orange
      else if (mood >= 6) markerBg = '#F59E0B'; // Golden yellow
      else markerBg = '#E11D48'; // Muted red

      const stickerEmoji = entry.sticker?.id === 'ramen' ? '🍜' :
        entry.sticker?.id === 'calcifer' ? '🔥' :
        entry.sticker?.id === 'leaf' ? '🍃' :
        entry.sticker?.id === 'sootsprite' ? '✨' :
        entry.sticker?.id === 'kitsune' ? '🦊' :
        entry.sticker?.id === 'totoro' ? '🌿' :
        entry.sticker?.id === 'origami' ? '🕊️' :
        entry.sticker?.id === 'dango' ? '🍡' : '🍥';

      const customIcon = L.divIcon({
        className: 'custom-mood-marker',
        html: `
          <div style="
            background-color: ${markerBg};
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(234, 88, 12, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            font-family: system-ui, sans-serif;
          ">
            ${entry.sticker ? stickerEmoji : mood}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const stickerBadgeHtml = entry.sticker ? `
        <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; background: #FFF7ED; color: #C2410C; padding: 2px 8px; border-radius: 9999px; border: 1px solid #FDBA74;">
          ${stickerEmoji} ${entry.sticker.name}
        </div>
      ` : '';

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 4px 2px; max-width: 230px;">
          <div style="font-weight: 800; font-size: 13px; color: #431407; margin-bottom: 2px;">
            ${entry.location?.placeName || 'Journal Spot'}
          </div>
          <div style="font-size: 11px; color: #9A3412; margin-bottom: 6px;">
            ${new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} &bull; Vitality: <b>${mood}/10</b>
          </div>
          <div style="font-size: 12px; color: #7C2D12; font-style: italic; line-height: 1.4; margin-bottom: 8px;">
            "${entry.text.slice(0, 95)}${entry.text.length > 95 ? '...' : ''}"
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
            <div style="display: inline-block; font-size: 10px; font-weight: 700; background-color: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 9999px; border: 1px solid #FCD34D;">
              ${entry.primaryEmotion || entry.sentiment || 'Reflective'}
            </div>
            ${stickerBadgeHtml}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedEntry(entry);
      });

      markersLayer.addLayer(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [geotaggedEntries]);

  const handlePanToEntry = (entry: JournalEntry) => {
    if (!mapInstanceRef.current || !entry.location?.latitude || !entry.location?.longitude) return;
    setSelectedEntry(entry);
    mapInstanceRef.current.setView([entry.location.latitude, entry.location.longitude], 15, {
      animate: true,
    });
  };

  return (
    <div id="entries-map-container" className="max-w-5xl mx-auto space-y-4">
      {/* Map Header and Legend */}
      <div className="bg-white rounded-2xl border border-[#EAE4DD] p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif-natural text-[#3E3833] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#5A6B5D]" />
            Geotagged Mood Map
          </h2>
          <p className="text-xs text-[#8C847C] mt-0.5">
            {geotaggedEntries.length} reflection{geotaggedEntries.length === 1 ? '' : 's'} mapped across your daily sanctuaries
          </p>
        </div>

        {/* Legend in Natural Tones */}
        <div className="flex items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#5A6B5D] inline-block border border-white shadow-2xs"></span>
            <span className="text-[#7A736E] text-[11px] font-medium">Vitality (8-10)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D18B63] inline-block border border-white shadow-2xs"></span>
            <span className="text-[#7A736E] text-[11px] font-medium">Balanced (5-7)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#BE5A5A] inline-block border border-white shadow-2xs"></span>
            <span className="text-[#7A736E] text-[11px] font-medium">Distress (1-4)</span>
          </div>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[440px] rounded-2xl overflow-hidden border border-[#EAE4DD] shadow-xs relative">
          <div ref={mapContainerRef} className="w-full h-full" />
          {geotaggedEntries.length === 0 && (
            <div className="absolute inset-0 bg-amber-950/10 backdrop-blur-xs flex items-center justify-center p-6 text-center z-20 pointer-events-none">
              <div className="bg-[#FFFDF9] p-6 rounded-2xl shadow-md max-w-sm space-y-2 border border-amber-300">
                <Navigation className="w-6 h-6 text-orange-600 mx-auto" />
                <h3 className="text-sm font-serif-natural font-bold text-amber-950">No Geotagged Pins Yet</h3>
                <p className="text-xs text-amber-800">
                  When writing a journal entry, enable browser GPS to pin your reflections to real village coordinates!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side list of geotagged entries */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-5 shadow-xs h-[440px] flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900 mb-3 flex items-center justify-between">
            <span>Mapped Locations ({geotaggedEntries.length})</span>
            <span className="text-[10px] text-orange-600 font-bold">🍃 Ninja Scroll</span>
          </h3>

          {geotaggedEntries.length === 0 ? (
            <div className="my-auto text-center p-4 text-xs text-amber-800">
              Entries will appear here as you log reflections with GPS or village locations.
            </div>
          ) : (
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {geotaggedEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => handlePanToEntry(entry)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-amber-50/90 shadow-2xs ring-1 ring-orange-400'
                        : 'border-amber-200/80 bg-white hover:border-amber-400 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-amber-950 truncate">
                        {entry.location?.placeName || 'Journal Spot'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-orange-700 border border-amber-300">
                        {entry.moodScore}/10
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-800/80 flex items-center gap-1 mb-1.5 font-medium">
                      <Calendar className="w-3 h-3 text-orange-600" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {entry.location?.city ? ` • ${entry.location.city}` : ''}
                    </div>

                    <p className="text-amber-900/90 line-clamp-2 text-[11px] italic">
                      "{entry.text}"
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {entry.primaryEmotion && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 capitalize font-bold">
                          {entry.primaryEmotion}
                        </span>
                      )}
                      {entry.sticker && (
                        <AnimeStickerBadge sticker={entry.sticker} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
