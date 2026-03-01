"use client";

// Cache para evitar requisições repetidas
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  // Verificar cache primeiro
  if (geocodeCache.has(address)) {
    console.log(`[CACHE HIT] ${address}`);
    return geocodeCache.get(address)!;
  }

  console.log(`[GEOCODING] Attempting: "${address}"`);
  
  const strategies = [
    { name: 'completo', addr: address },
    { name: 'sem CEP', addr: simplifyAddress(address) },
    { name: 'apenas rua e número', addr: getStreetAndNumber(address) },
    { name: 'cidade e estado', addr: getCityState(address) },
    { name: 'apenas rua', addr: getStreetOnly(address) },
    { name: 'formato alternativo', addr: formatAlternative(address) }
  ];

  for (const strategy of strategies) {
    if (!strategy.addr.trim()) {
      console.log(`[SKIP] Strategy "${strategy.name}" produced empty string`);
      continue;
    }
    
    console.log(`[TRY] Strategy "${strategy.name}": "${strategy.addr}"`);
    
    try {
      const result = await tryGeocodeWithOpenStreetMap(strategy.addr);
      if (result) {
        console.log(`[SUCCESS] Strategy "${strategy.name}" worked for "${address}"`);
        geocodeCache.set(address, result);
        return result;
      } else {
        console.log(`[NO RESULT] Strategy "${strategy.name}" returned no results`);
      }
    } catch (error) {
      console.warn(`[ERROR] Strategy ${strategy.name} falhou para "${address}":`, error);
    }
  }

  console.error(`[FAILED] All strategies failed for: "${address}"`);
  throw new Error(`Não foi possível encontrar o endereço: "${address}"`);
}

function getStreetAndNumber(address: string): string {
  // Extrair rua e número do formato brasileiro
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  
  const parts = cleaned.split(' - ');
  if (parts.length >= 3) {
    const streetPart = parts[0];
    const cityState = parts[2];
    const city = cityState.split('/')[0];
    const state = cityState.split('/')[1] || cityState;
    return `${streetPart}, ${city}, ${state}`;
  }
  
  return cleaned;
}

function getCityState(address: string): string {
  const match = address.match(/([A-Za-z\s]+)\/([A-Za-z]{2})\s*$/);
  if (match) {
    return `${match[1]}, ${match[2]}`;
  }
  return '';
}

function getStreetOnly(address: string): string {
  const match = address.match(/^([^,]+),/);
  if (match) {
    return match[1].trim();
  }
  return address.split(',')[0].trim();
}

function simplifyAddress(address: string): string {
  let simplified = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  
  const parts = simplified.split(' - ');
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[2]}`;
  }
  
  return simplified.trim();
}

function formatAlternative(address: string): string {
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  cleaned = cleaned.replace(' - ', ', ');
  return cleaned;
}

async function tryGeocodeWithOpenStreetMap(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=br`;
    console.log(`[API] Requesting: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RoteirizadorApp/1.0 (contato@roteirizador.com.br)",
        "Accept-Language": "pt-BR,pt,en",
        "Accept": "application/json",
      },
    });
    
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
      }
      throw new Error(`Erro de rede: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[API] Response data:`, JSON.stringify(data, null, 2));
    
    if (data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    console.log(`[API] No results found for: "${address}"`);
    return null;
  } catch (error) {
    console.error('[API] Error:', error);
    throw error;
  }
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function optimizeRoute(addresses: string[]): Promise<string[]> {
  if (addresses.length === 0) return [];
  
  console.log(`[OPTIMIZE] Starting optimization for ${addresses.length} addresses`);
  
  // Geocode all addresses sequentially to respect rate limits
  const locations: Array<{ addr: string; lat: number; lon: number; index: number }> = [];
  
  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    console.log(`[OPTIMIZE] Processing address ${i + 1}/${addresses.length}: "${addr}"`);
    
    try {
      const coords = await geocode(addr);
      locations.push({ addr, ...coords, index: i });
      console.log(`[OPTIMIZE] Successfully geocoded ${i + 1}/${addresses.length}`);
    } catch (error) {
      console.error(`[OPTIMIZE] Failed to geocode address ${i + 1}:`, error);
      throw error; // Re-throw to stop optimization
    }
    
    // Wait 1 second between requests to respect Nominatim's rate limit
    if (i < addresses.length - 1) {
      console.log(`[OPTIMIZE] Waiting 1 second before next request...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[OPTIMIZE] All addresses geocoded. Starting route optimization...`);
  
  const visited = new Set<number>();
  const ordered: string[] = [];
  let currentIndex = 0;

  while (ordered.length < locations.length) {
    ordered.push(locations[currentIndex].addr);
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
    currentIndex = nearest;
  }

  console.log(`[OPTIMIZE] Route optimization complete. Order:`, ordered);
  return ordered;
}

export async function calculateTotalDistance(addresses: string[]): Promise<number> {
  if (addresses.length < 2) return 0;
  
  const locations = await Promise.all(
    addresses.map(async (addr) => {
      const coords = await geocode(addr);
      return coords;
    })
  );

  let totalDistance = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    totalDistance += haversine(
      locations[i].lat,
      locations[i].lon,
      locations[i + 1].lat,
      locations[i + 1].lon
    );
  }
  
  return totalDistance;
}