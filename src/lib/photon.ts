export interface PhotonFeature {
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

export function formatPhotonAddress(feat: PhotonFeature): string {
  const name = feat.properties.name || ''
  const street = feat.properties.street || ''
  const city = feat.properties.city || ''
  const country = feat.properties.country || ''
  return [street || name, city, country].filter(Boolean).join(', ')
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`
  )
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  const feat = data.features?.[0] as PhotonFeature | undefined
  if (feat) return formatPhotonAddress(feat)
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
  )
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  const feat = data.features?.[0] as PhotonFeature | undefined
  if (!feat) return null
  const [lng, lat] = feat.geometry.coordinates
  return { lat, lng, label: formatPhotonAddress(feat) }
}
