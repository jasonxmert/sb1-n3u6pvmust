"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import GlobeComponent from './globe/globe-component';

const Globe = dynamic(() => Promise.resolve(GlobeComponent), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square md:aspect-[4/3] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
});

interface Marker {
  name: string;
  state: string;
  country: string;
  postcode: string;
  lat: number;
  lng: number;
}

interface InteractiveGlobeProps {
  searchResults: any;
}

export default function InteractiveGlobe({ searchResults }: InteractiveGlobeProps) {
  const [mounted, setMounted] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const globeRef = useRef<any>(null);

  const handleResize = useCallback(() => {
    if (!mounted) return;
    const container = document.getElementById('globe-container');
    if (container) {
      const width = container.clientWidth;
      const height = width * (window.innerWidth >= 768 ? 0.75 : 1);
      setDimensions({ width, height });
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize, mounted]);

  useEffect(() => {
    if (!mounted || !searchResults?.places?.[0]) return;

    const place = searchResults.places[0];
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker: Marker = {
        name: place["place name"],
        state: place.state,
        country: searchResults.country,
        postcode: searchResults["post code"],
        lat,
        lng
      };

      setMarkers([newMarker]);

      // Focus on the location after a short delay
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.pointOfView({
            lat,
            lng,
            altitude: 1.8
          }, 1000);
        }
      }, 100);
    }
  }, [searchResults, mounted]);

  if (!mounted) return null;

  return (
    <div className="my-8 md:my-16">
      <div id="globe-container" className="relative w-full">
        <Globe
          forwardedRef={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="rgba(200,230,255,0.2)"
          atmosphereAltitude={0.1}
          pointsData={markers}
          pointAltitude={0.01}
          pointColor={() => "hsl(var(--primary))"}
          pointRadius={0.5}
          pointResolution={32}
          pointsMerge={false}
          pointLabel={(d: Marker) => `
            <div class="bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm whitespace-nowrap border">
              <div class="font-semibold">${d.name}</div>
              <div class="text-muted-foreground">
                ${d.postcode}<br/>
                ${d.state}, ${d.country}<br/>
                <span class="text-xs font-mono">
                  ${d.lat.toFixed(4)}°, ${d.lng.toFixed(4)}°
                </span>
              </div>
            </div>
          `}
          onGlobeReady={() => {
            if (globeRef.current) {
              const controls = globeRef.current.controls();
              if (controls) {
                controls.autoRotate = false;
                controls.enableZoom = true;
                controls.enablePan = true;
                controls.enableRotate = true;
                controls.minDistance = 200;
                controls.maxDistance = 500;
              }
              if (globeRef.current.renderer()) {
                globeRef.current.renderer().setClearColor(0x000000, 0);
              }
            }
          }}
        />
      </div>
    </div>
  );
}