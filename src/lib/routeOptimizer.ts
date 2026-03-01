"use client";

export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  try {
    // Try with the full address first
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RoutingApp/1.0 (contact@example.com)",
        "Accept-Language": "pt-BR,pt,en",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    // If full address fails, try with simplified address
    const simplifiedAddress = simplifyAddress(address);
    const simplifiedUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedAddress)}&limit=1&addressdetails=1`;
    const simplifiedResponse = await fetch(simplifiedUrl, {
      headers: {
        "User-Agent": "RoutingApp/1.0 (contact@example.com)",
        "Accept-Language": "pt-BR,pt,en",
      },
    });

    if (!simplifiedResponse.ok) {
      throw new Error(`Erro de rede: ${simplifiedResponse.status}`);
    }

    const simplifiedData = await simplifiedResponse.json();
    if (simplifiedData.length > 0) {
      return {
        lat: parseFloat(simplifiedData[0].lat),
        lon: parseFloat(simplifiedData[0].lon),
      };
    }

    throw new Error(`Endereço não encontrado: "${address}"`);
  } catch (error) {
    throw new Error(`Falha ao geocodificar endereço "${address}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

function simplifyAddress(address: string): string {
  // Remove CEP, complementos e informações menos relevantes
  return address
    .replace(/-\s*\d{5}-?\d{3}/g, '') // Remove CEP
    .replace(/-\s*[A-Za-z0-9\s]+/g, '') // Remove complementos
    .replace(/\s*-\s*[A-Za-z0-9\s]+/g, '') // Remove traços e complementos
    .replace(/\s*,\s*[A-Za-z0-9\s]+$/g, '') // Remove bairro final
    .trim();
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
  
  // Geocode all addresses with rate limiting
  const locations = await Promise.all(
    addresses.map(async (addr, index) => {
      try {
        const coords = await geocode(addr);
        return { addr, ...coords, index };
      } catch (err) {
        throw new Error(`Falha no endereço ${index + 1} (${addr}): ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
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