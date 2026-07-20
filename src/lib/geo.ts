/** Haversine distance in km between two WGS84 points */
export function haversineKm(
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

/** Rough driving ETA from straight-line km (urban average ~28 km/h with road factor) */
export function etaMinutesFromKm(distanceKm: number): number {
  const roadKm = distanceKm * 1.35
  return Math.max(2, Math.round((roadKm / 28) * 60))
}

export function estimateTripFare(
  baseFare: number,
  perKmFare: number,
  tripKm: number
): number {
  return Math.round((baseFare + perKmFare * tripKm) * 100) / 100
}
