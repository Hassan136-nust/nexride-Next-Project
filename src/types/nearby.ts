export type VehicleType = 'bike' | 'car' | 'loading' | 'truck' | 'auto'

export interface NearbyPartnerVehicle {
  id: string
  type: VehicleType
  vehicleModel: string
  number: string
  imageUrl: string | null
  baseFare: number
  perKmFare: number
  waitingFare: number
}

export interface NearbyPartner {
  partnerId: string
  partnerName: string
  lat: number
  lng: number
  distanceKm: number
  etaMin: number
  estimatedFare: number
  isOnline: boolean
  vehicle: NearbyPartnerVehicle
}
