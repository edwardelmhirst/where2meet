'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/loading-spinner'
import { JourneyDetails } from '@/components/journey-details'
import { api, LocationInput, MeetingPointResponse } from '@/lib/api'
import { Plus, Trash2, MapPin, Clock, Users, TrendingUp, Zap, Award, ArrowRight, Map } from 'lucide-react'

// Dynamic import for the map to avoid SSR issues
const MeetingMap = dynamic(() => import('./meeting-map').then(mod => mod.MeetingMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full gradient-primary animate-pulse" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

// Helper functions for fairness display
const getFairnessDescription = (rating: string): string => {
  switch (rating) {
    case 'Very Fair':
      return 'Everyone travels similar times'
    case 'Fair':
      return 'Journey times are well balanced'
    case 'Moderate':
      return 'Some variation in journey times'
    case 'Somewhat Unfair':
      return 'Significant differences in travel'
    case 'Unfair':
      return 'Large disparities in journey times'
    default:
      return 'Unknown fairness rating'
  }
}

const getFairnessColor = (rating: string): string => {
  switch (rating) {
    case 'Very Fair':
      return 'text-green-600'
    case 'Fair':
      return 'text-blue-600'
    case 'Moderate':
      return 'text-yellow-600'
    case 'Somewhat Unfair':
      return 'text-orange-600'
    case 'Unfair':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

const getFairnessCardColors = (score: string): { bg: string, text: string, icon: string } => {
  switch (score) {
    case 'Very Fair':
      return { 
        bg: 'from-green-50 to-green-100', 
        text: 'text-green-900',
        icon: 'text-green-700'
      }
    case 'Fair':
      return { 
        bg: 'from-emerald-50 to-emerald-100', 
        text: 'text-emerald-900',
        icon: 'text-emerald-700'
      }
    case 'Moderate':
      return { 
        bg: 'from-yellow-50 to-yellow-100', 
        text: 'text-yellow-900',
        icon: 'text-yellow-700'
      }
    case 'Somewhat Unfair':
      return { 
        bg: 'from-orange-50 to-orange-100', 
        text: 'text-orange-900',
        icon: 'text-orange-700'
      }
    case 'Unfair':
      return { 
        bg: 'from-red-50 to-red-100', 
        text: 'text-red-900',
        icon: 'text-red-700'
      }
    default:
      return { 
        bg: 'from-gray-50 to-gray-100', 
        text: 'text-gray-900',
        icon: 'text-gray-700'
      }
  }
}

export function MeetingPointCalculator() {
  const [locations, setLocations] = useState<LocationInput[]>([
    { name: '', address: '' },
    { name: '', address: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeetingPointResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(0) // 0 = optimal, 1+ = alternatives

  // Same colors as the map markers
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

  const handleAddLocation = () => {
    if (locations.length < 10) {
      setLocations([...locations, { name: '', address: '' }])
    }
  }

  const handleRemoveLocation = (index: number) => {
    if (locations.length > 2) {
      setLocations(locations.filter((_, i) => i !== index))
    }
  }

  const handleLocationChange = (index: number, field: keyof LocationInput, value: string) => {
    const updatedLocations = [...locations]
    updatedLocations[index] = { ...updatedLocations[index], [field]: value }
    setLocations(updatedLocations)
  }

  const handleCalculate = async () => {
    setError(null)
    
    // Validate inputs
    const validLocations = locations.filter(loc => loc.name && (loc.address || (loc.latitude && loc.longitude)))
    if (validLocations.length < 2) {
      setError('Please provide at least 2 valid locations with names and addresses')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.calculateMeetingPoint({
        locations: validLocations,
        use_tfl_api: true
      })
      setResult(response)
      setSelectedStationIndex(0) // Reset to optimal station when new results come in
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate meeting point')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get the current display configuration
  const getDisplayConfig = () => {
    if (!result) return null

    // Limit to optimal + 3 best alternatives (4 total)
    const limitedAlternatives = result.alternative_stations.slice(0, 3)
    const allStations = [result.optimal_station, ...limitedAlternatives]
    const currentStation = allStations[selectedStationIndex]
    
    // Create alternatives array excluding the currently selected station
    const alternatives = allStations.filter((_, index) => index !== selectedStationIndex)
    
    return {
      currentStation,
      alternatives,
      modifiedResult: {
        ...result,
        optimal_station: currentStation
      }
    }
  }

  const handleStationClick = (stationIndex: number) => {
    // Only allow clicking on stations within our limited set (optimal + 3 alternatives)
    if (stationIndex <= 3) {
      setSelectedStationIndex(stationIndex)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}
      
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="overflow-hidden border-0 shadow-2xl hover-lift">
          <div className="h-2 gradient-primary" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg gradient-primary">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              Calculate Your Meeting Point
            </CardTitle>
            <CardDescription className="text-base">
              Enter each person&apos;s starting location and we&apos;ll find the fairest spot for everyone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {locations.map((location, index) => {
                // Get initials from name
                const getInitials = (name: string) => {
                  if (!name) return '?'
                  const parts = name.trim().split(' ')
                  if (parts.length === 1) {
                    return parts[0].charAt(0).toUpperCase()
                  }
                  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                }
                
                return (
                  <div key={index} className="group relative">
                    <div className="flex gap-4 items-end">
                      <div className="flex-shrink-0 mt-8">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd)`,
                          }}
                        >
                          {getInitials(location.name)}
                        </div>
                      </div>
                    <div 
                      className="flex-1 flex gap-4 items-end p-4 rounded-xl border-2 transition-all"
                      style={{
                        background: `linear-gradient(to right, ${colors[index % colors.length]}10, ${colors[index % colors.length]}08)`,
                        borderColor: `${colors[index % colors.length]}30`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${colors[index % colors.length]}60`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${colors[index % colors.length]}30`
                      }}
                    >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`} className="text-sm font-medium text-gray-700">
                          Person {index + 1} Name
                        </Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="e.g., Alice"
                          value={location.name}
                          onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                          className="border-gray-200"
                          style={{
                            borderColor: location.name ? `${colors[index % colors.length]}40` : undefined,
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`address-${index}`} className="text-sm font-medium text-gray-700">
                          Address or Station
                        </Label>
                        <Input
                          id={`address-${index}`}
                          placeholder="e.g., Victoria Station, London"
                          value={location.address || ''}
                          onChange={(e) => handleLocationChange(index, 'address', e.target.value)}
                          className="border-gray-200"
                          style={{
                            borderColor: location.address ? `${colors[index % colors.length]}40` : undefined,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLocation(index)}
                      disabled={locations.length <= 2}
                      className="hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleAddLocation}
                disabled={locations.length >= 10}
                className="border-purple-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 hover:text-white hover:border-transparent transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
              <Button 
                onClick={handleCalculate} 
                className="flex-1 md:flex-initial gradient-primary text-white hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
              >
                <Zap className="mr-2 h-4 w-4" />
                Find Meeting Point
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (() => {
          const displayConfig = getDisplayConfig()
          if (!displayConfig) return null
          
          const { currentStation, alternatives, modifiedResult } = displayConfig
          const isOptimalSelected = selectedStationIndex === 0
          
          return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-0 shadow-2xl">
                <div className="h-1 gradient-primary" />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
                    <Award className="h-4 w-4" />
                    {isOptimalSelected ? 'OPTIMAL LOCATION' : 'ALTERNATIVE LOCATION'}
                  </div>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <div className="p-3 rounded-xl gradient-primary shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    {currentStation.station_name}
                    {!isOptimalSelected && (
                      <span className="text-lg text-gray-500 font-normal">
                        (Alternative #{selectedStationIndex})
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isOptimalSelected 
                      ? "The fairest meeting point based on everyone's journey times"
                      : "Alternative meeting point - click alternatives below to explore options"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Map visualization */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-lg">Route Visualization</h3>
                    </div>
                    <MeetingMap result={modifiedResult} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover-lift">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                          <Clock className="h-4 w-4" />
                          Average Journey
                        </div>
                        <p className="text-3xl font-bold text-purple-900">
                          {Math.round(currentStation.average_journey_time)} min
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover-lift">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                          <Users className="h-4 w-4" />
                          Longest Journey
                        </div>
                        <p className="text-3xl font-bold text-blue-900">
                          {Math.round(currentStation.max_journey_time)} min
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={`border-0 hover-lift bg-gradient-to-br ${
                      currentStation.fairness_score === 'Very Fair' 
                        ? 'from-green-50 to-green-100' 
                        : currentStation.fairness_score === 'Fair'
                        ? 'from-emerald-50 to-emerald-100'
                        : currentStation.fairness_score === 'Moderate'
                        ? 'from-yellow-50 to-yellow-100'
                        : currentStation.fairness_score === 'Somewhat Unfair'
                        ? 'from-orange-50 to-orange-100'
                        : currentStation.fairness_score === 'Unfair'
                        ? 'from-red-50 to-red-100'
                        : 'from-gray-50 to-gray-100'
                    }`}>
                      <CardContent className="pt-6">
                        <div className={`flex items-center gap-2 text-sm mb-2 ${
                          currentStation.fairness_score === 'Very Fair'
                            ? 'text-green-700'
                            : currentStation.fairness_score === 'Fair'
                            ? 'text-emerald-700'
                            : currentStation.fairness_score === 'Moderate'
                            ? 'text-yellow-700'
                            : currentStation.fairness_score === 'Somewhat Unfair'
                            ? 'text-orange-700'
                            : currentStation.fairness_score === 'Unfair'
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}>
                          <TrendingUp className="h-4 w-4" />
                          Fairness Rating
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            currentStation.fairness_score === 'Very Fair'
                              ? 'text-green-900'
                              : currentStation.fairness_score === 'Fair'
                              ? 'text-emerald-900'
                              : currentStation.fairness_score === 'Moderate'
                              ? 'text-yellow-900'
                              : currentStation.fairness_score === 'Somewhat Unfair'
                              ? 'text-orange-900'
                              : currentStation.fairness_score === 'Unfair'
                              ? 'text-red-900'
                              : 'text-gray-900'
                          }`}>
                            {currentStation.fairness_score}
                          </p>
                          <p className={`text-xs mt-1 ${
                            currentStation.fairness_score === 'Very Fair'
                              ? 'text-green-700'
                              : currentStation.fairness_score === 'Fair'
                              ? 'text-emerald-700'
                              : currentStation.fairness_score === 'Moderate'
                              ? 'text-yellow-700'
                              : currentStation.fairness_score === 'Somewhat Unfair'
                              ? 'text-orange-700'
                              : currentStation.fairness_score === 'Unfair'
                              ? 'text-red-700'
                              : 'text-gray-700'
                          }`}>
                            {getFairnessDescription(currentStation.fairness_score)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <JourneyDetails 
                    journeys={currentStation.journey_times} 
                    colors={colors}
                  />

                  {alternatives.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        {isOptimalSelected ? 'Alternative Stations' : 'Other Options'}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (Click to switch view)
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alternatives.map((station, displayIndex) => {
                          // Find the original index of this station in the limited set
                          const limitedAlternatives = result.alternative_stations.slice(0, 3)
                          const allStations = [result.optimal_station, ...limitedAlternatives]
                          const originalIndex = allStations.findIndex(s => s.station_name === station.station_name)
                          
                          return (
                            <Card 
                              key={originalIndex} 
                              className="border border-purple-100 hover:border-purple-300 transition-all hover-lift cursor-pointer transform hover:scale-105"
                              onClick={() => handleStationClick(originalIndex)}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-semibold text-lg text-gray-800 flex-1">
                                    {station.station_name}
                                  </h4>
                                  {originalIndex === 0 && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                                      OPTIMAL
                                    </span>
                                  )}
                                  {originalIndex > 0 && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                                      #{originalIndex}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Average:</span>
                                    <span className="font-medium text-purple-600">{Math.round(station.average_journey_time)} min</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Maximum:</span>
                                    <span className="font-medium text-blue-600">{Math.round(station.max_journey_time)} min</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Fairness:</span>
                                    <span className={`font-medium ${getFairnessColor(station.fairness_score)}`}>
                                      {station.fairness_score}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-500 text-center">
                                    Click to view this station
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })()}
      </div>
    </>
  )
}