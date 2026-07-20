import type { VehicleType } from '@/types/nearby'

const VEHICLE_STYLES: Record<
  VehicleType,
  { color: string; glyph: string; label: string }
> = {
  bike: { color: '#0ea5e9', glyph: '🏍', label: 'Bike' },
  car: { color: '#10b981', glyph: '🚗', label: 'Car' },
  auto: { color: '#f59e0b', glyph: '🛺', label: 'Auto' },
  loading: { color: '#8b5cf6', glyph: '📦', label: 'Loader' },
  truck: { color: '#f43f5e', glyph: '🚚', label: 'Truck' },
}

export function makeVehicleMapIcon(type: VehicleType) {
  if (typeof window === 'undefined') return null as any;
  const L = require('leaflet')
  const style = VEHICLE_STYLES[type] ?? VEHICLE_STYLES.car

  return L.divIcon({
    className: 'custom-map-pin vehicle-map-pin',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="
          background:${style.color};
          color:#fff;
          font-size:11px;
          font-weight:800;
          padding:3px 7px;
          border-radius:8px;
          margin-bottom:4px;
          box-shadow:0 4px 14px rgba(0,0,0,0.28);
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:4px;
        ">
          <span style="font-size:13px;line-height:1">${style.glyph}</span>
          <span>${style.label}</span>
        </div>
        <div style="
          width:36px;
          height:36px;
          background:#fff;
          border:3px solid ${style.color};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:18px;
          box-shadow:0 6px 18px rgba(0,0,0,0.22);
        ">${style.glyph}</div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  })
}

export function getVehicleStyle(type: VehicleType) {
  return VEHICLE_STYLES[type] ?? VEHICLE_STYLES.car
}
