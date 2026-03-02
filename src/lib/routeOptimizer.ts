"use client";

// Cache to avoid repeated requests
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export interface Location {
  addr: string;
  lat: number;
  lon: number;
  error?: boolean;
}

/**
 * Attempts to get coordinates for a string address using OpenStreetMap Nominatim
 */
export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const strategies = [
    address,
    address.replace(/\s*\d{5}-?\d{3}\s*$/, ''),
    address.split(',')[0],
  ];

  for (const query of strategies) {
    if (!query || query.trim().length < 3) continue;
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Roteirizador-App" }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
        geocodeCache.set(address, result);
        return result;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  throw new Error(`Endereço não encontrado: ${address}`);
}

/**
 * Simple Nearest Neighbor algorithm for the Traveling Salesperson Problem
 */
export async function optimizeRoute(
  addresses: string[], 
  returnToStart: boolean = false,
  onProgress?: (progress: number) => void
): Promise<{ locations: Location[], failed: string[] }> {
  const locations: Location[] = [];
  const failed: string[] = [];
  
  for (let i = 0; i < addresses.length; i++) {
    try {
      const coords = await geocode(addresses[i]);
      locations.push({ addr: addresses[i], ...coords });
    } catch (e) {
      failed.push(addresses[i]);
    }
    if (onProgress) onProgress(Math.round(((i + 1) / addresses.length) * 100));
  }

  if (locations.length < 2) return { locations, failed };

  const unvisited = [...locations];
  const ordered: Location[] = [];
  
  let current = unvisited.shift()!;
  const startNode = { ...current };
  ordered.push(current);

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  if (returnToStart && ordered.length > 1) {
    ordered.push({ ...startNode, addr: `${startNode.addr} (Retorno)` });
  }

  return { locations: ordered, failed };
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function calculateTotalDistance(locations: Location[]): number {
  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += haversine(locations[i].lat, locations[i].lon, locations[i+1].lat, locations[i+1].lon);
  }
  return total;
}