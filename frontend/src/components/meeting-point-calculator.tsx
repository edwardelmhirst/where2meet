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

export function MeetingPointCalculator() {
  const [locations, setLocations] = useState<LocationInput[]>([
    { name: '', address: '' },
    { name: '', address: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeetingPointResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate meeting point')
    } finally {
      setIsLoading(false)
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

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="overflow-hidden border-0 shadow-2xl">
              <div className="h-1 gradient-primary" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
                  <Award className="h-4 w-4" />
                  OPTIMAL LOCATION FOUND
                </div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <div className="p-3 rounded-xl gradient-primary shadow-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  {result.optimal_station.station_name}
                </CardTitle>
                <CardDescription className="text-base">
                  The fairest meeting point based on everyone&apos;s journey times
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Map visualization */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Route Visualization</h3>
                  </div>
                  <MeetingMap result={result} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                        <Clock className="h-4 w-4" />
                        Average Journey
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {Math.round(result.optimal_station.average_journey_time)} min
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
                        {Math.round(result.optimal_station.max_journey_time)} min
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-pink-50 to-pink-100 hover-lift">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-sm text-pink-700 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        Fairness Score
                      </div>
                      <p className="text-3xl font-bold text-pink-900">
                        {result.optimal_station.fairness_score.toFixed(1)}/10
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <JourneyDetails 
                  journeys={result.optimal_station.journey_times} 
                  colors={colors}
                />

                {result.alternative_stations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      Alternative Stations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.alternative_stations.slice(0, 3).map((station, index) => (
                        <Card key={index} className="border border-purple-100 hover:border-purple-300 transition-all hover-lift">
                          <CardContent className="pt-4">
                            <h4 className="font-semibold text-lg mb-3 text-gray-800">{station.station_name}</h4>
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
                                <span className="text-gray-600">Score:</span>
                                <span className="font-medium text-pink-600">{station.fairness_score.toFixed(1)}/10</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}