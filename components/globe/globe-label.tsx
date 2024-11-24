"use client";

interface GlobeLabelProps {
  name: string;
  postcode: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export default function GlobeLabel({ name, postcode, state, country, lat, lng }: GlobeLabelProps) {
  return (
    <div className="fixed bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm whitespace-nowrap z-50 border border-[hsl(var(--border))]" 
         style={{ transform: 'translate(-50%, -100%)', marginTop: '-15px' }}>
      <div className="font-semibold text-base">{name}</div>
      <div className="text-muted-foreground space-y-1">
        <div>{postcode}</div>
        <div>{state}, {country}</div>
        <div className="text-xs font-mono">
          {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </div>
      </div>
    </div>
  );
}