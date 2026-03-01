"use client";

export async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MyRoutingApp/1.0 (your@email.com)",
    },
  });
  if (!response.ok) {
    throw new Error("Erro ao consultar serviço de geocodificação");
  }
  const data = await response.json();
  if (data.length === 0) {
    throw new Error(`Endereço não encontrado: ${address}`);
  }
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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
  // Geocode all addresses
  const locations = await Promise.all(
    addresses.map(async (addr) => {
      const coords = await geocode(addr);
      return { addr, ...coords };
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