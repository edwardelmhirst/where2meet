'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/loading-spinner'
import { api, LocationInput, MeetingPointResponse } from '@/lib/api'
import { Plus, Trash2, MapPin, Clock, Users } from 'lucide-react'

export function MeetingPointCalculator() {
  const [locations, setLocations] = useState<LocationInput[]>([
    { name: '', address: '' },
    { name: '', address: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MeetingPointResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Find Your Perfect Meeting Point
            </CardTitle>
            <CardDescription>
              Enter the locations of all participants to find the most convenient meeting spot in London
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {locations.map((location, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>
                        Person {index + 1} Name
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="e.g., Alice"
                        value={location.name}
                        onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`address-${index}`}>
                        Address or Station
                      </Label>
                      <Input
                        id={`address-${index}`}
                        placeholder="e.g., Victoria Station, London"
                        value={location.address || ''}
                        onChange={(e) => handleLocationChange(index, 'address', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLocation(index)}
                    disabled={locations.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleAddLocation}
                disabled={locations.length >= 10}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
              <Button onClick={handleCalculate} className="flex-1 md:flex-initial">
                Calculate Meeting Point
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Optimal Meeting Point: {result.optimal_station.station_name}
              </CardTitle>
              <CardDescription>
                Based on journey times from all participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      Average Journey Time
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(result.optimal_station.average_journey_time)} min
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      Max Journey Time
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(result.optimal_station.max_journey_time)} min
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      Fairness Score
                    </div>
                    <p className="text-2xl font-bold">
                      {result.optimal_station.fairness_score.toFixed(1)}/10
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Journey Times</h3>
                <div className="space-y-2">
                  {result.optimal_station.journey_times.map((journey, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{journey.from_location}</span>
                      <span className="text-muted-foreground">
                        {journey.duration_minutes} minutes
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {result.alternative_stations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Alternative Stations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.alternative_stations.slice(0, 3).map((station, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">{station.station_name}</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Avg: {Math.round(station.average_journey_time)} min</p>
                            <p>Max: {Math.round(station.max_journey_time)} min</p>
                            <p>Score: {station.fairness_score.toFixed(1)}/10</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}