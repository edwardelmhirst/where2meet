'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JourneyDetail } from '@/lib/api'
import { 
  Train, 
  Bus, 
  PersonStanding, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  MapPin,
  ArrowRight,
  Repeat
} from 'lucide-react'

interface JourneyDetailsProps {
  journeys: JourneyDetail[]
  colors: string[]
}

const getModeIcon = (mode: string) => {
  const modeLower = mode.toLowerCase()
  if (modeLower === 'walking') return <PersonStanding className="h-4 w-4" />
  if (modeLower === 'bus') return <Bus className="h-4 w-4" />
  return <Train className="h-4 w-4" />
}

const getModeColor = (mode: string) => {
  const modeLower = mode.toLowerCase()
  if (modeLower === 'walking') return 'bg-green-100 text-green-700 border-green-200'
  if (modeLower === 'bus') return 'bg-red-100 text-red-700 border-red-200'
  if (modeLower === 'dlr') return 'bg-teal-100 text-teal-700 border-teal-200'
  if (modeLower === 'overground') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-blue-100 text-blue-700 border-blue-200'
}

export function JourneyDetails({ journeys, colors }: JourneyDetailsProps) {
  const [expandedJourney, setExpandedJourney] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Train className="h-5 w-5 text-purple-600" />
        Detailed Journey Information
      </h3>
      
      <div className="space-y-3">
        {journeys.map((journey, index) => {
          const isExpanded = expandedJourney === index
          const getInitials = (name: string) => {
            if (!name) return '?'
            const parts = name.trim().split(' ')
            if (parts.length === 1) {
              return parts[0].charAt(0).toUpperCase()
            }
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
          }

          return (
            <Card 
              key={index} 
              className="overflow-hidden border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: `${colors[index % colors.length]}30`,
              }}
            >
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setExpandedJourney(isExpanded ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd)`,
                      }}
                    >
                      {getInitials(journey.from_location)}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{journey.from_location}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {journey.duration_minutes} min
                        </span>
                        {journey.total_transfers > 0 && (
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {journey.total_transfers} change{journey.total_transfers > 1 ? 's' : ''}
                          </span>
                        )}
                        {journey.total_walking_duration > 0 && (
                          <span className="flex items-center gap-1">
                            <PersonStanding className="h-3 w-3" />
                            {journey.total_walking_duration} min walking
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </div>
              </CardHeader>
              
              {isExpanded && journey.legs && journey.legs.length > 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      {journey.legs.map((leg, legIndex) => (
                        <div key={legIndex} className="relative">
                          {legIndex !== journey.legs.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                          )}
                          
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getModeColor(leg.mode)} relative z-10 bg-white`}>
                              {getModeIcon(leg.mode)}
                            </div>
                            
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm">{leg.instruction}</p>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {leg.from_name || 'Starting point'}
                                    </p>
                                    <p className="flex items-center gap-1 ml-3">
                                      <ArrowRight className="h-3 w-3" />
                                      {leg.to_name || 'Destination'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  <p className="font-medium">{leg.duration} min</p>
                                  {leg.distance && (
                                    <p className="text-xs text-muted-foreground">
                                      {(leg.distance / 1000).toFixed(1)} km
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {journey.route_type === 'estimated' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ This is an estimated journey. Enable TfL API for accurate journey details.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}