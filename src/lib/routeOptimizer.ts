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
  
  // Estratégias de formatação mais robustas
  const strategies = [
    { name: 'completo', addr: address },
    { 
      name: 'sem CEP', 
      addr: address.replace(/\s*\d{5}-?\d{3}\s*$/, '') 
    },
    { 
      name: 'apenas rua e número', 
      addr: extractStreetAndNumber(address) 
    },
    { 
      name: 'cidade e estado', 
      addr: extractCityState(address) 
    },
    { 
      name: 'apenas rua', 
      addr: extractStreetOnly(address) 
    },
    { 
      name: 'formato alternativo', 
      addr: formatAlternativeAddress(address) 
    }
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

// Funções auxiliares mais robustas
function extractStreetAndNumber(address: string): string {
  // Remove CEP e formata para "Rua, Cidade, Estado"
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  
  // Divide por traços ou hífens
  const parts = cleaned.split(/[\-\–]\s*/);
  if (parts.length >= 3) {
    const streetPart = parts[0].trim();
    const cityState = parts[2].trim();
    
    // Extrai cidade e estado
    const cityStateMatch = cityState.match(/([A-Za-z\s]+)\/([A-Za-z]{2})\s*$/);
    if (cityStateMatch) {
      const city = cityStateMatch[1].trim();
      const state = cityStateMatch[2].trim();
      return `${streetPart}, ${city}, ${state}`;
    }
    
    // Se não encontrar formato cidade/estado, tenta extrair cidade
    const cityMatch = cityState.match(/^([A-Za-z\s]+),\s*([A-Z]{2})$/);
    if (cityMatch) {
      return `${streetPart}, ${cityMatch[1]}, ${cityMatch[2]}`;
    }
    
    return `${streetPart}, ${cityState}`;
  }
  
  return cleaned;
}

function extractCityState(address: string): string {
  // Extrai cidade e estado de formatos comuns
  const cityStatePatterns = [
    /([A-Za-z\s]+)\/([A-Za-z]{2})\s*$/,
    /([A-Za-z\s]+),\s*([A-Z]{2})\s*$/,
    /([A-Za-z\s]+)\s+([A-Z]{2})\s*$/
  ];
  
  for (const pattern of cityStatePatterns) {
    const match = address.match(pattern);
    if (match) {
      return `${match[1]}, ${match[2]}`;
    }
  }
  
  return address;
}

function extractStreetOnly(address: string): string {
  // Extrai apenas a rua (até a primeira vírgula)
  const match = address.match(/^([^,]+),/);
  if (match) {
    return match[1].trim();
  }
  return address.split(',')[0].trim();
}

function formatAlternativeAddress(address: string): string {
  // Formata endereços alternativos
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  cleaned = cleaned.replace(/[\-\–]\s*/g, ', ');
  return cleaned;
}

async function tryGeocodeWithOpenStreetMap(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // URL mais robusta com parâmetros otimizados
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=br&email=contato@roteirizador.com.br`;
    
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
  console.log(`[OPTIMIZE] Original order:`, addresses);
  
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

  console.log(`[OPTIMIZE] All addresses geocoded. Locations:`, locations);
  
  // If only 1 or 2 addresses, return as-is (no optimization needed)
  if (locations.length <= 2) {
    const result = locations.map(loc => loc.addr);
    console.log(`[OPTIMIZE] Only ${locations.length} addresses, returning original order:`, result);
    return result;
  }

  // Start from the first address (index 0) and find nearest neighbors
  const visited = new Set<number>();
  const ordered: string[] = [];
  let currentIndex = 0; // Always start with the first address

  while (ordered.length < locations.length) {
    ordered.push(locations[currentIndex].addr);
    visited.add(currentIndex);
    console.log(`[OPTIMIZE] Added address ${ordered.length}/${locations.length}:`, locations[currentIndex].addr);

    let nearest = -1;
    let nearestDist = Infinity;
    
    // Find the nearest unvisited location
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
    
    if (nearest === -1) {
      // All visited, break
      break;
    }
    
    currentIndex = nearest;
  }

  console.log(`[OPTIMIZE] Route optimization complete. Final order:`, ordered);
  console.log(`[OPTIMIZE] Expected ${addresses.length} addresses, got ${ordered.length}`);
  
  // Ensure we have all addresses
  if (ordered.length !== addresses.length) {
    console.warn(`[OPTIMIZE] Missing ${addresses.length - ordered.length} addresses!`);
    // Add any missing addresses at the end
    for (const loc of locations) {
      if (!ordered.includes(loc.addr)) {
        ordered.push(loc.addr);
        console.log(`[OPTIMIZE] Added missing address:`, loc.addr);
      }
    }
  }
  
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