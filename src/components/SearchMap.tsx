'use client'

import React, { useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet'
import L, { type LatLngTuple } from 'leaflet'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Navigation, Route, Users } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { NearbyPartner } from '@/types/nearby'
import { makeVehicleMapIcon } from '@/lib/vehicleMapIcons'

export interface RidePoint {
  lat: number
  lng: number
  label: string
}

export interface RouteStats {
  distanceKm: number
  durationMin: number
  coordinates: LatLngTuple[]
}

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const CARTO_TILE =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function makePinIcon(color: string, label: string) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="
          background:${color};
          color:#fff;
          font-size:10px;
          font-weight:800;
          padding:2px 6px;
          border-radius:6px;
          margin-bottom:4px;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          white-space:nowrap;
          letter-spacing:0.04em;
        ">${label}</div>
        <div style="
          width:14px;
          height:14px;
          background:${color};
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 4px 14px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  })
}

const pickupIcon = makePinIcon('#f59e0b', 'PICKUP')
const dropoffIcon = makePinIcon('#0ea5e9', 'DROP')

function FitMapBounds({
  pickup,
  dropoff,
  route,
  nearbyPartners = [],
}: {
  pickup: RidePoint
  dropoff: RidePoint
  route: RouteStats | null
  nearbyPartners?: NearbyPartner[]
}) {
  const map = useMap()

  useEffect(() => {
    const points: LatLngTuple[] =
      route?.coordinates?.length && route.coordinates.length > 1
        ? [...route.coordinates]
        : [
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]

    for (const p of nearbyPartners) {
      points.push([p.lat, p.lng])
    }

    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15, animate: true })
  }, [
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    route,
    nearbyPartners,
    map,
  ])

  return null
}

interface SearchMapProps {
  pickup: RidePoint
  dropoff: RidePoint
  route: RouteStats | null
  routeLoading: boolean
  nearbyPartners?: NearbyPartner[]
  selectedPartnerId?: string | null
  onPickupMoved: (point: RidePoint) => void
  onDropoffMoved: (point: RidePoint) => void
  onPartnerSelect?: (partner: NearbyPartner) => void
}

export default function SearchMap({
  pickup,
  dropoff,
  route,
  routeLoading,
  nearbyPartners = [],
  selectedPartnerId,
  onPickupMoved,
  onDropoffMoved,
  onPartnerSelect,
}: SearchMapProps) {
  const center = useMemo<LatLngTuple>(
    () => [
      (pickup.lat + dropoff.lat) / 2,
      (pickup.lng + dropoff.lng) / 2,
    ],
    [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]
  )

  const distanceKm = route?.distanceKm ?? null
  const durationMin = route?.durationMin ?? null
  const onlineCount = nearbyPartners.length

  return (
    <div className='relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-100 shadow-inner'>
      <MapContainer
        center={center}
        zoom={13}
        className='h-full w-full z-0'
        scrollWheelZoom
        style={{ height: '100%', width: '100%', background: '#e8eef4' }}
      >
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_TILE}
          subdomains='abcd'
          maxZoom={20}
        />

        <FitMapBounds
          pickup={pickup}
          dropoff={dropoff}
          route={route}
          nearbyPartners={nearbyPartners}
        />

        {route && route.coordinates.length > 1 && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: '#18181b',
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={pickupIcon}
          draggable
          zIndexOffset={1000}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng()
              onPickupMoved({ ...pickup, lat, lng })
            },
          }}
        />

        <Marker
          position={[dropoff.lat, dropoff.lng]}
          icon={dropoffIcon}
          draggable
          zIndexOffset={1000}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng()
              onDropoffMoved({ ...dropoff, lat, lng })
            },
          }}
        />

        {nearbyPartners.map((partner) => (
          <Marker
            key={partner.partnerId}
            position={[partner.lat, partner.lng]}
            icon={makeVehicleMapIcon(partner.vehicle.type)}
            zIndexOffset={selectedPartnerId === partner.partnerId ? 900 : 500}
            eventHandlers={{
              click: () => onPartnerSelect?.(partner),
            }}
          />
        ))}
      </MapContainer>

      <div className='pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col items-center gap-2 p-3'>
        <AnimatePresence mode='wait'>
          {routeLoading ? (
            <motion.div
              key='loading'
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className='flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md'
            >
              <span className='h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white' />
              Updating route…
            </motion.div>
          ) : distanceKm != null && durationMin != null ? (
            <motion.div
              key={`${distanceKm}-${durationMin}`}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className='flex items-center gap-3 rounded-2xl border border-white/15 bg-black/80 px-4 py-2.5 shadow-xl backdrop-blur-md'
            >
              <div className='flex items-center gap-2 border-r border-white/10 pr-3'>
                <Route size={16} className='text-emerald-400' />
                <div>
                  <p className='text-[9px] font-bold uppercase tracking-wider text-zinc-500'>
                    Distance
                  </p>
                  <p className='text-sm font-black text-white'>{distanceKm} km</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Clock size={16} className='text-sky-400' />
                <div>
                  <p className='text-[9px] font-bold uppercase tracking-wider text-zinc-500'>
                    Est. ride
                  </p>
                  <p className='text-sm font-black text-white'>{durationMin} min</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!routeLoading && onlineCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200 backdrop-blur-md'
          >
            <Users size={13} />
            {onlineCount} partner{onlineCount !== 1 ? 's' : ''} nearby (5 km)
          </motion.div>
        )}
      </div>

      <div className='pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-black/10 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm'>
        <span className='flex items-center gap-1'>
          <Navigation size={11} />
          Drag pins · tap vehicles on map
        </span>
      </div>
    </div>
  )
}
