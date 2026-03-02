"use client";

// Cache para evitar requisições repetidas
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export interface Location {
  addr: string;
  lat: number;
  lon: number;
}

export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const strategies = [
    { name: 'completo', addr: address },
    { name: 'sem CEP', addr: address.replace(/\s*\d{5}-?\d{3}\s*$/, '') },
    { name: 'apenas rua e número', addr: extractStreetAndNumber(address) },
    { name: 'cidade e estado', addr: extractCityState(address) }
  ];

  for (const strategy of strategies) {
    if (!strategy.addr.trim()) continue;
    try {
      const result = await tryGeocodeWithOpenStreetMap(strategy.addr);
      if (result) {
        geocodeCache.set(address, result);
        return result;
      }
    } catch (error) {
      console.warn(`Geocoding failed for strategy ${strategy.name}:`, error);
    }
  }

  throw new Error(`Não foi possível encontrar o endereço: "${address}"`);
}

function extractStreetAndNumber(address: string): string {
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  const parts = cleaned.split(/[\-\–]\s*/);
  if (parts.length >= 3) {
    const streetPart = parts[0].trim();
    const cityState = parts[2].trim();
    return `${streetPart}, ${cityState}`;
  }
  return cleaned;
}

function extractCityState(address: string): string {
  const cityStatePatterns = [
    /([A-Za-z\s]+)\/([A-Za-z]{2})\s*$/,
    /([A-Za-z\s]+),\s*([A-Z]{2})\s*$/
  ];
  for (const pattern of cityStatePatterns) {
    const match = address.match(pattern);
    if (match) return `${match[1]}, ${match[2]}`;
  }
  return address;
}

async function tryGeocodeWithOpenStreetMap(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=br&email=contato@roteirizador.com.br`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RoteirizadorApp/1.0",
        "Accept-Language": "pt-BR,pt,en",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function optimizeRoute(addresses: string[]): Promise<Location[]> {
  if (addresses.length === 0) return [];
  
  const locations: Location[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const coords = await geocode(addresses[i]);
    locations.push({ addr: addresses[i], ...coords });
    if (i < addresses.length - 1) await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (locations.length <= 2) return locations;

  const visited = new Set<number>();
  const ordered: Location[] = [];
  let currentIndex = 0;

  while (ordered.length < locations.length) {
    ordered.push(locations[currentIndex]);
    visited.add(currentIndex);

    let nearest = -1;
    let nearestDist = Infinity;
    
    for (let i = 0; i < locations.length; i++) {
      if (visited.has(i)) continue;
      const d = haversine(
        locations[currentIndex].lat,
        locations[currentIndex].lon,
        locations[i].lat,
        locations[i].lon
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    if (nearest === -1) break;
    currentIndex = nearest;
  }

  return ordered;
}

export function calculateDistance(locations: Location[]): number {
  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += haversine(locations[i].lat, locations[i].lon, locations[i+1].lat, locations[i+1].lon);
  }
  return total;
}