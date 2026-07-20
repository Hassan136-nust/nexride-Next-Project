'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L, { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchDrivingRoute } from '@/lib/routing'

// Voyager (light) tiles — same as customer SearchMap
const CARTO_TILE =
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

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
          padding:2px 8px;
          border-radius:6px;
          margin-bottom:4px;
          box-shadow:0 4px 12px rgba(0,0,0,0.28);
          white-space:nowrap;
          letter-spacing:0.05em;
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

function FitBounds({
    pickup,
    dropoff,
    routeCoords,
}: {
    pickup: LatLngTuple
    dropoff: LatLngTuple
    routeCoords: LatLngTuple[]
}) {
    const map = useMap()
    useEffect(() => {
        const pts: LatLngTuple[] =
            routeCoords.length > 1 ? routeCoords : [pickup, dropoff]
        const bounds = L.latLngBounds(pts)
        map.fitBounds(bounds, { padding: [64, 64], maxZoom: 14, animate: true })
    }, [pickup, dropoff, routeCoords, map])
    return null
}

interface PartnerRouteMapProps {
    pickupLat: number
    pickupLng: number
    dropoffLat: number
    dropoffLng: number
    distanceKm?: number
    durationMin?: number
}

export default function PartnerRouteMap({
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    distanceKm,
    durationMin,
}: PartnerRouteMapProps) {
    const [routeCoords, setRouteCoords] = useState<LatLngTuple[]>([])
    const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null)

    const pickupPt: LatLngTuple = [pickupLat, pickupLng]
    const dropoffPt: LatLngTuple = [dropoffLat, dropoffLng]

    useEffect(() => {
        fetchDrivingRoute(
            { lat: pickupLat, lng: pickupLng },
            { lat: dropoffLat, lng: dropoffLng }
        ).then((r) => {
            setRouteCoords(r.coordinates)
            setRouteStats({
                distanceKm: distanceKm ?? r.distanceKm,
                durationMin: durationMin ?? r.durationMin,
            })
        })
    }, [pickupLat, pickupLng, dropoffLat, dropoffLng, distanceKm, durationMin])

    return (
        <div className='relative h-full w-full'>
            {/* Stats overlay pill — same style as SearchMap */}
            {routeStats && (
                <div className='absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 rounded-xl border border-white/10 bg-black/75 px-4 py-2 shadow-2xl backdrop-blur-md'>
                    <div className='flex items-center gap-1.5'>
                        <span className='text-emerald-400'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </span>
                        <span className='text-[9px] font-bold uppercase tracking-widest text-zinc-400'>Distance</span>
                        <span className='ml-1 text-sm font-black text-white'>{routeStats.distanceKm} km</span>
                    </div>
                    <div className='h-4 w-px bg-white/20' />
                    <div className='flex items-center gap-1.5'>
                        <span className='text-sky-400'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        </span>
                        <span className='text-[9px] font-bold uppercase tracking-widest text-zinc-400'>Est. Ride</span>
                        <span className='ml-1 text-sm font-black text-white'>{routeStats.durationMin} min</span>
                    </div>
                </div>
            )}

            <MapContainer
                center={pickupPt}
                zoom={12}
                className='h-full w-full'
                zoomControl={true}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#f0f0f0' }}
            >
                <TileLayer
                    attribution={CARTO_ATTRIBUTION}
                    url={CARTO_TILE}
                    subdomains='abcd'
                />

                <FitBounds pickup={pickupPt} dropoff={dropoffPt} routeCoords={routeCoords} />

                {/* Route polyline — thick dark stroke like SearchMap */}
                {routeCoords.length > 1 && (
                    <Polyline
                        positions={routeCoords}
                        pathOptions={{ color: '#1a1a1a', weight: 5, opacity: 0.85 }}
                    />
                )}

                <Marker position={pickupPt} icon={pickupIcon} />
                <Marker position={dropoffPt} icon={dropoffIcon} />
            </MapContainer>
        </div>
    )
}
