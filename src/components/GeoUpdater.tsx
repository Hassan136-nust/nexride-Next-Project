'use client'
import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'

type Props = {
  userId?: string
  /** Only partners broadcast live GPS to the socket server */
  trackLocation?: boolean
}

const LOCATION_EMIT_MS = 5000

function GeoUpdater({ userId, trackLocation = false }: Props) {
  const lastEmitRef = useRef(0)

  useEffect(() => {
    if (!userId) return

    const socket = getSocket()

    const emitIdentity = () => {
      socket.emit('identity', { userId })
    }

    // Emit identity immediately if connected, and always on (re)connect
    if (socket.connected) {
      emitIdentity()
    }
    socket.on('connect', emitIdentity)

    return () => {
      socket.off('connect', emitIdentity)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !trackLocation || !navigator.geolocation) return

    const socket = getSocket()

    const emitLocation = (latitude: number, longitude: number) => {
      const now = Date.now()
      if (now - lastEmitRef.current < LOCATION_EMIT_MS) return
      lastEmitRef.current = now

      // Primary: socket
      socket.emit('updateLocation', {
        userId,
        coordinates: [longitude, latitude],
      })

      // Fallback: REST API (ensures DB is updated even if socket drops)
      fetch('/api/partner/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      }).catch(() => {
        // silent — socket is the primary channel
      })
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        emitLocation(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message)
      },
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
    )

    navigator.geolocation.getCurrentPosition(
      (pos) => emitLocation(pos.coords.latitude, pos.coords.longitude),
      () => { },
      { enableHighAccuracy: true, timeout: 12000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [userId, trackLocation])

  return null
}

export default GeoUpdater
