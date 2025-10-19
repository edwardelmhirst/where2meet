'use client'

import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MeetingPointResponse, JourneyLeg } from '@/lib/api'

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

// Transport line colors based on TfL standards
const getLineColor = (modeName: string, lineName?: string): string => {
  const mode = modeName.toLowerCase().trim()
  const line = (lineName || '').toLowerCase().trim()
  
  // MODE CHECK FIRST - Bus always gets red
  if (mode === 'bus') return '#E32017' // TfL bus red
  if (mode === 'walking') return '#333333'
  
  // TUBE/RAIL LINES - Check line name for specific colors
  if (line && (mode === 'tube' || mode === 'underground' || mode === 'rail')) {
    // Official TfL hex colors
    if (line.includes('bakerloo')) return '#B36305'
    if (line.includes('central')) return '#E32017'
    if (line.includes('circle')) return '#FFD300'
    if (line.includes('district')) return '#00782A'
    if (line.includes('hammersmith') || line.includes('h&c')) return '#F3A9BB'
    if (line.includes('jubilee')) return '#A0A5A9'
    if (line.includes('metropolitan')) return '#9B0056'
    if (line.includes('northern')) return '#000000'
    if (line.includes('piccadilly')) return '#003688'
    if (line.includes('victoria')) return '#0098D4'
    if (line.includes('waterloo') || line.includes('w&c')) return '#95CDBA'
  }
  
  // DLR/Overground/Elizabeth line
  if (mode === 'dlr' || line.includes('dlr')) return '#00A77E'
  if (mode === 'overground' || line.includes('overground')) return '#EF7B10'
  if (line.includes('elizabeth')) return '#9364CC'
  if (line.includes('tram')) return '#6CC04A'
  
  // Fallback for generic tube (shouldn't happen with proper line names)
  if (mode === 'tube' || mode === 'underground') return '#003688'
  
  // Default gray (should rarely reach here)
  return '#666666'
}

// Get line style based on transport mode
const getLineStyle = (mode: string): { dashArray?: string, weight: number, opacity: number } => {
  const modeLower = mode.toLowerCase().trim()
  
  // Walking - dotted
  if (modeLower === 'walking') {
    return { dashArray: '5, 10', weight: 3, opacity: 0.6 }
  }
  
  // Bus - dashed
  if (modeLower === 'bus') {
    return { dashArray: '10, 5', weight: 4, opacity: 0.7 }
  }
  
  // Everything else (tube, dlr, overground, rail) - SOLID
  return { weight: 5, opacity: 0.9 }
}

// Component to auto-fit bounds
function AutoFitBounds({ locations }: { locations: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => L.latLng(loc[0], loc[1])))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, locations])
  
  return null
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

  // Process journey data with actual route legs
  const journeyRoutes = useMemo(() => {
    return result.optimal_station.journey_times.map((journey, index) => {
      const location = result.processed_locations[index]
      return {
        from: [location.latitude, location.longitude] as [number, number],
        to: [optimalStation.latitude, optimalStation.longitude] as [number, number],
        personColor: colors[index % colors.length],
        name: location.name,
        journeyTime: journey.duration_minutes,
        legs: journey.legs || [],
        totalWalking: journey.total_walking_duration || 0,
        transfers: journey.total_transfers || 0
      }
    })
  }, [result, optimalStation, colors])

  // Collect all marker positions for auto-fitting bounds
  const allMarkerPositions = useMemo(() => {
    const positions: [number, number][] = [
      [optimalStation.latitude, optimalStation.longitude], // Meeting point
      ...journeyRoutes.map(route => route.from) // All starting locations
    ]
    
    // Also include all intermediate points from journey legs
    journeyRoutes.forEach(route => {
      route.legs.forEach(leg => {
        if (leg.from_coords && leg.to_coords) {
          positions.push(leg.from_coords as [number, number])
          positions.push(leg.to_coords as [number, number])
        }
      })
    })
    
    return positions
  }, [optimalStation, journeyRoutes])

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

  // Create a legend component
  const MapLegend = () => (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
      <h4 className="font-semibold text-sm mb-2">Journey Routes</h4>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <svg width="24" height="4">
            <line x1="0" y1="2" x2="24" y2="2" stroke="#333" strokeWidth="2" strokeDasharray="2,4" />
          </svg>
          <span>Walking</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="24" height="4">
            <line x1="0" y1="2" x2="24" y2="2" stroke="#E32017" strokeWidth="3" strokeDasharray="6,3" />
          </svg>
          <span>Bus</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="24" height="4">
            <line x1="0" y1="2" x2="24" y2="2" stroke="#0098D4" strokeWidth="3" />
          </svg>
          <span>Tube/Rail</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-purple-100 relative">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <AutoFitBounds locations={allMarkerPositions} />
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

        {/* Individual location markers and detailed journey routes */}
        {journeyRoutes.map((journey, journeyIndex) => (
          <React.Fragment key={journeyIndex}>
            {/* Draw each leg of the journey */}
            {journey.legs.length > 0 ? (
              journey.legs.map((leg, legIndex) => {
                if (!leg.from_coords || !leg.to_coords) return null
                
                // Get ONE color for this ENTIRE leg
                const lineColor = getLineColor(leg.mode, leg.line_name)
                const lineStyle = getLineStyle(leg.mode)
                
                // Debug what's actually being applied
                console.log(`Applying to Polyline - J${journeyIndex}L${legIndex}:`, {
                  mode: leg.mode,
                  line: leg.line_name,
                  color: lineColor,
                  dashArray: lineStyle.dashArray || 'SOLID',
                  from: leg.from_name?.substring(0, 20),
                  to: leg.to_name?.substring(0, 20)
                })
                
                // Build the complete path including intermediate stops
                const legPath: [number, number][] = [
                  leg.from_coords as [number, number]
                ]
                
                // Add intermediate stops if they exist
                if (leg.intermediate_stops && leg.intermediate_stops.length > 0) {
                  leg.intermediate_stops.forEach(stop => {
                    legPath.push(stop as [number, number])
                  })
                }
                
                // Add the final destination
                legPath.push(leg.to_coords as [number, number])
                
                // Create a unique key for this leg
                const uniqueKey = `journey-${journeyIndex}-leg-${legIndex}-${leg.mode}-${leg.line_name || 'no-line'}`
                
                return (
                  <React.Fragment key={uniqueKey}>
                    {/* Route line for this leg */}
                    <Polyline
                      key={`polyline-${uniqueKey}`}
                      positions={legPath}
                      pathOptions={{
                        color: lineColor,
                        weight: lineStyle.weight,
                        opacity: lineStyle.opacity,
                        dashArray: lineStyle.dashArray || undefined,
                        lineCap: 'round',
                        lineJoin: 'round'
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{leg.instruction || `${leg.mode} leg`}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {leg.from_name} → {leg.to_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {leg.duration} min • {leg.stops ? `${leg.stops} stops` : ''}
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    
                    {/* No station markers - just the lines show the routes */}
                  </React.Fragment>
                )
              })
            ) : (
              // Fallback to simple line if no detailed legs available
              <Polyline
                positions={[[journey.from[0], journey.from[1]], [journey.to[0], journey.to[1]]]}
                color={journey.personColor}
                weight={3}
                opacity={0.5}
                dashArray="10, 10"
              />
            )}
            
            {/* Starting point marker */}
            <Marker 
              position={journey.from} 
              icon={createPersonIcon(journey.personColor, getInitials(journey.name))}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold" style={{ color: journey.personColor }}>
                    {journey.name}
                  </h4>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p>Total time: {journey.journeyTime} min</p>
                    {journey.totalWalking > 0 && (
                      <p>Walking: {journey.totalWalking} min</p>
                    )}
                    {journey.transfers > 0 && (
                      <p>Changes: {journey.transfers}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  )
}