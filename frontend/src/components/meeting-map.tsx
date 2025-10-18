'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MeetingPointResponse } from '@/lib/api'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MeetingMapProps {
  result: MeetingPointResponse
}

// Create custom icons with initials
const createPersonIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      ">
        ${label}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const meetingPointIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background: linear-gradient(135deg, #a855f7, #3b82f6);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid white;
      box-shadow: 0 8px 16px rgba(168, 85, 247, 0.4);
      position: relative;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" fill="white"/>
        <circle cx="12" cy="10" r="3" fill="#a855f7"/>
      </svg>
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background: #f97316;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        border: 2px solid white;
      ">★</div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
})

// Generate route points (simplified - in production you'd use actual routing API)
const generateRoutePoints = (start: [number, number], end: [number, number]): [number, number][] => {
  const points: [number, number][] = [start]
  
  // Create a curved path with some intermediate points
  const midLat = (start[0] + end[0]) / 2
  const midLng = (start[1] + end[1]) / 2
  
  // Add some curve to the route
  const offset = 0.002 * Math.random() - 0.001
  points.push([midLat + offset, midLng - offset])
  points.push(end)
  
  return points
}

export function MeetingMap({ result }: MeetingMapProps) {
  const colors = [
    '#a855f7', // purple
    '#3b82f6', // blue
    '#f97316', // orange
    '#10b981', // emerald
    '#f43f5e', // rose
    '#6366f1', // indigo
    '#84cc16', // lime
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#8b5cf6', // violet
  ]

  // Different map tile options - all clean and minimal
  const mapTiles = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    voyager: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    positron: {
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    darkNoLabels: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    toner: {
      url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    },
    tonerBackground: {
      url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_background/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    },
    watercolor: {
      url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    },
    alidade: {
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    },
    alidadeDark: {
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    }
  }

  const selectedTile = mapTiles.alidade // Using watercolor for an artistic, unique look

  const mapCenter = result.map_center as [number, number]
  const optimalStation = result.optimal_station

  // Calculate routes from each location to the meeting point
  const routes = result.processed_locations.map((location, index) => ({
    from: [location.latitude, location.longitude] as [number, number],
    to: [optimalStation.latitude, optimalStation.longitude] as [number, number],
    color: colors[index % colors.length],
    name: location.name,
    journeyTime: result.optimal_station.journey_times[index]?.duration_minutes || 0,
  }))

  useEffect(() => {
    // Add custom styles for the map after component mounts
    if (typeof window !== 'undefined' && document.head) {
      const style = document.createElement('style')
      style.setAttribute('data-map-styles', 'true')
      style.innerHTML = `
        .leaflet-container {
          font-family: inherit;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-marker-shadow {
          display: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-content {
          margin: 12px;
          font-size: 14px;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        if (document.head && style.parentNode) {
          document.head.removeChild(style)
        }
      }
    }
  }, [])

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-purple-100">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution={selectedTile.attribution}
          url={selectedTile.url}
          opacity={1}
        />
        
        {/* Meeting point marker */}
        <Marker position={[optimalStation.latitude, optimalStation.longitude]} icon={meetingPointIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg text-purple-600">
                {optimalStation.station_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">Optimal Meeting Point</p>
              <div className="mt-2 space-y-1 text-xs">
                <p>Avg journey: {Math.round(optimalStation.average_journey_time)} min</p>
                <p>Max journey: {Math.round(optimalStation.max_journey_time)} min</p>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Individual location markers and routes */}
        {routes.map((route, index) => (
          <React.Fragment key={index}>
            {/* Route line */}
            <Polyline
              positions={generateRoutePoints(route.from, route.to)}
              color={route.color}
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
            
            {/* Starting point marker */}
            <Marker 
              position={route.from} 
              icon={createPersonIcon(route.color, getInitials(route.name))}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold" style={{ color: route.color }}>
                    {route.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Journey time: {route.journeyTime} min
                  </p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  )
}