const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface LocationInput {
  name: string
  address?: string
  latitude?: number
  longitude?: number
}

export interface MeetingStation {
  station_name: string
  latitude: number
  longitude: number
  average_journey_time: number
  max_journey_time: number
  total_journey_time: number
  fairness_score: number
  journey_times: Array<{
    from_location: string
    to_station: string
    duration_minutes: number
    route_type: string
  }>
}

export interface MeetingPointRequest {
  locations: LocationInput[]
  use_tfl_api?: boolean
  preferences?: Record<string, any>
}

export interface MeetingPointResponse {
  request_id: string
  created_at: string
  optimal_station: MeetingStation
  alternative_stations: MeetingStation[]
  processed_locations: Array<{
    name: string
    address?: string
    latitude: number
    longitude: number
  }>
  map_center: [number, number]
}

export class MeetingPointAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async calculateMeetingPoint(request: MeetingPointRequest): Promise<MeetingPointResponse> {
    const response = await fetch(`${this.baseUrl}/api/meeting-points/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to calculate meeting point')
    }

    return response.json()
  }

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    const response = await fetch(`${this.baseUrl}/api/meeting-points/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    })

    if (!response.ok) {
      throw new Error('Failed to geocode address')
    }

    const data = await response.json()
    return {
      latitude: data.latitude,
      longitude: data.longitude,
    }
  }

  async getStations(): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
    const response = await fetch(`${this.baseUrl}/api/meeting-points/stations`)

    if (!response.ok) {
      throw new Error('Failed to fetch stations')
    }

    const data = await response.json()
    return data.stations
  }
}

export const api = new MeetingPointAPI()