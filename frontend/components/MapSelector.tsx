"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";

// Fix Leaflet's default icon issue with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapSelectorProps {
  onSelect: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export default function MapSelector({ onSelect, onCancel }: MapSelectorProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  // default to Chandigarh, India roughly
  const defaultCenter: [number, number] = [30.7333, 76.7794];

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return position === null ? null : <Marker position={position} />;
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border rounded-xl shadow-lg w-full max-w-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm text-slate-800">
          Tap map to set location
        </h4>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕ cancel
        </button>
      </div>
      <div className="h-48 w-full rounded-md overflow-hidden bg-slate-100 z-10">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!position}
          onClick={() => position && onSelect(position[0], position[1])}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-8 text-xs"
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
