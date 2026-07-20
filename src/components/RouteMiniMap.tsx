'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import L, { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Dynamic import Leaflet elements to prevent SSR window reference crashes
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
)
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
)
const Polyline = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polyline),
    { ssr: false }
)

const CARTO_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
const CARTO_TILE =
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function makePinIcon(color: string, label: string) {
    if (typeof window === 'undefined') return null
    return L.divIcon({
        className: 'custom-mini-pin',
        html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="
          background:${color};
          color:#fff;
          font-size:8px;
          font-weight:900;
          padding:1px 4px;
          border-radius:4px;
          margin-bottom:2px;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
          white-space:nowrap;
        ">${label}</div>
        <div style="
          width:8px;
          height:8px;
          background:${color};
          border:1.5px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
        "></div>
      </div>
    `,
        iconSize: [1, 1],
        iconAnchor: [0, 0],
    })
}

// Fit bounds handler helper component inside the Leaflet map container context
const FitBoundsHelper = dynamic(
    () =>
        Promise.resolve(({ bounds }: { bounds: LatLngTuple[] }) => {
            const { useMap } = require('react-leaflet')
            const map = useMap()
            useEffect(() => {
                if (bounds.length > 0) {
                    const lBounds = L.latLngBounds(bounds)
                    map.fitBounds(lBounds, { padding: [16, 16], maxZoom: 14, animate: false })
                }
            }, [bounds, map])
            return null
        }),
    { ssr: false }
)

interface RouteMiniMapProps {
    pickupLat: number
    pickupLng: number
    dropoffLat: number
    dropoffLng: number
}

function RouteMiniMapContent({
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
}: RouteMiniMapProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const pickupPoint = useMemo<LatLngTuple>(
        () => [pickupLat, pickupLng],
        [pickupLat, pickupLng]
    )
    const dropoffPoint = useMemo<LatLngTuple>(
        () => [dropoffLat, dropoffLng],
        [dropoffLat, dropoffLng]
    )
    const bounds = useMemo<LatLngTuple[]>(
        () => [pickupPoint, dropoffPoint],
        [pickupPoint, dropoffPoint]
    )

    const pickupIcon = useMemo(() => makePinIcon('#f59e0b', 'P'), [])
    const dropoffIcon = useMemo(() => makePinIcon('#0ea5e9', 'D'), [])

    if (!isClient || !pickupIcon || !dropoffIcon) {
        return (
            <div className='flex h-[180px] w-full items-center justify-center rounded-xl bg-zinc-950 font-semibold text-zinc-500'>
                Loading Route Map…
            </div>
        )
    }

    return (
        <div className='relative h-[180px] w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-950 shadow-inner z-0'>
            <MapContainer
                center={pickupPoint}
                zoom={12}
                className='h-full w-full'
                scrollWheelZoom={false}
                zoomControl={false}
                dragging={false}
                doubleClickZoom={false}
                style={{ height: '100%', width: '100%', background: '#09090b' }}
            >
                <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_TILE} subdomains='abcd' />

                <FitBoundsHelper bounds={bounds} />

                <Polyline
                    positions={[pickupPoint, dropoffPoint]}
                    pathOptions={{
                        color: '#10b981',
                        weight: 3.5,
                        opacity: 0.8,
                        dashArray: '5, 5',
                    }}
                />

                <Marker position={pickupPoint} icon={pickupIcon} />
                <Marker position={dropoffPoint} icon={dropoffIcon} />
            </MapContainer>
        </div>
    )
}

export default function RouteMiniMap(props: RouteMiniMapProps) {
    return <RouteMiniMapContent {...props} />
}
