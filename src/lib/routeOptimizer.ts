"use client";

// Cache para evitar requisições repetidas
const geocodeCache = new Map<string, { lat: number; lon: number }>();

export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  // Verificar cache primeiro
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const strategies = [
    { name: 'completo', addr: address },
    { name: 'sem CEP', addr: simplifyAddress(address) },
    { name: 'apenas rua e número', addr: getStreetAndNumber(address) },
    { name: 'cidade e estado', addr: getCityState(address) },
    { name: 'apenas rua', addr: getStreetOnly(address) }
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
      console.warn(`Estratégia ${strategy.name} falhou para "${address}":`, error);
    }
  }

  throw new Error(`Não foi possível encontrar o endereço: "${address}"`);
}

function getStreetAndNumber(address: string): string {
  // Extrair rua e número do formato brasileiro
  // Ex: "Rua Doutor Sales de Oliveira, 1400 - Vila Industrial - Campinas/SP - 13035-270"
  // Queremos: "Rua Doutor Sales de Oliveira, 1400, Campinas, SP"
  
  // Remover CEP no final
  let cleaned = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  
  // Manter apenas a primeira parte antes do primeiro " - " que não seja rua/número
  const parts = cleaned.split(' - ');
  if (parts.length >= 3) {
    // Formato: Rua, Número - Bairro - Cidade/Estado
    const streetPart = parts[0]; // "Rua Doutor Sales de Oliveira, 1400"
    const cityState = parts[2]; // "Campinas/SP"
    const city = cityState.split('/')[0];
    const state = cityState.split('/')[1] || cityState;
    return `${streetPart}, ${city}, ${state}`;
  }
  
  return cleaned;
}

function getCityState(address: string): string {
  // Extrair apenas cidade e estado
  const match = address.match(/([A-Za-z\s]+)\/([A-Za-z]{2})\s*$/);
  if (match) {
    return `${match[1]}, ${match[2]}`;
  }
  return '';
}

function getStreetOnly(address: string): string {
  // Extrair apenas nome da rua (sem número)
  const match = address.match(/^([^,]+),/);
  if (match) {
    return match[1].trim();
  }
  return address.split(',')[0].trim();
}

function simplifyAddress(address: string): string {
  // Remover CEP e bairro, manter rua, número, cidade e estado
  let simplified = address.replace(/\s*\d{5}-?\d{3}\s*$/, '');
  
  // Remover a parte do bairro (segundo " - ")
  const parts = simplified.split(' - ');
  if (parts.length >= 3) {
    // Manter primeira e terceira partes
    return `${parts[0]}, ${parts[2]}`;
  }
  
  return simplified.trim();
}

async function tryGeocodeWithOpenStreetMap(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=br`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RoteirizadorApp/1.0 (contato@roteirizador.com.br)",
        "Accept-Language": "pt-BR,pt,en",
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
      }
      throw new Error(`Erro de rede: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.warn('OpenStreetMap falhou:', error);
    throw error;
  }
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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
  
  // Geocode all addresses with retry logic
  const locations = await Promise.all(
    addresses.map(async (addr, index) => {
      let lastError: Error | null = null;
      
      // Tentar até 3 vezes para cada endereço
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const coords = await geocode(addr);
          return { addr, ...coords, index };
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            // Esperar um pouco antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          }
        }
      }
      
      throw new Error(`Falha no endereço ${index + 1} (${addr}): ${lastError?.message || 'Erro desconhecido'}`);
    })
  );

  const visited = new Set<number>();
  const ordered: string[] = [];
  let currentIndex = 0;

  while (ordered.length < locations.length) {
    ordered.push(locations[currentIndex].addr);
    visited.add(currentIndex);

    // Find nearest unvisited location
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