"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  addr: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  locations: Location[];
}

// Component to auto-fit the map bounds to show all markers
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && (bounds as any).length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapComponent({ locations }: MapComponentProps) {
  if (locations.length === 0) {
    return (
      <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed">
        Aguardando endereços para exibir o mapa...
      </div>
    );
  }

  const positions = locations.map(loc => [loc.lat, loc.lon] as [number, number]);
  const bounds = L.latLngBounds(positions);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-inner border border-gray-200 z-0">
      <MapContainer 
        center={positions[0]} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lon]}>
            <Popup>
              <div className="font-medium">Parada {idx + 1}</div>
              <div className="text-xs text-gray-600">{loc.addr}</div>
            </Popup>
          </Marker>
        ))}
        {locations.length > 1 && (
          <Polyline 
            positions={positions} 
            color="#3b82f6" 
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10"
          />
        )}
        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}