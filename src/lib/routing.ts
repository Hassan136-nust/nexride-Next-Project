import type { LatLngTuple } from 'leaflet'

export interface RouteResult {
  distanceKm: number
  durationMin: number
  coordinates: LatLngTuple[]
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fallbackRoute(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): RouteResult {
  const distanceKm = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
  const roadFactor = 1.35
  const adjustedKm = distanceKm * roadFactor
  const durationMin = Math.max(3, Math.round((adjustedKm / 28) * 60))
  return {
    distanceKm: Math.round(adjustedKm * 10) / 10,
    durationMin,
    coordinates: [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ],
  }
}

export async function fetchDrivingRoute(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<RouteResult> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return fallbackRoute(pickup, dropoff)
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route?.geometry?.coordinates?.length) {
      return fallbackRoute(pickup, dropoff)
    }

    const coordinates: LatLngTuple[] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as LatLngTuple
    )

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      coordinates,
    }
  } catch {
    return fallbackRoute(pickup, dropoff)
  }
}
