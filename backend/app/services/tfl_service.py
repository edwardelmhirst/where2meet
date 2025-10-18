import httpx
from typing import Tuple, Optional, Dict, List, Any
from geopy.distance import geodesic
import logging
from datetime import datetime, timedelta
from app.schemas import JourneyLeg, JourneyTime

logger = logging.getLogger(__name__)


class TfLService:
    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        self.app_id = app_id
        self.app_key = app_key
        self.client = httpx.AsyncClient(timeout=30.0)
        self._cache = {}  # Simple in-memory cache
    
    async def get_journey_details(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float,
        from_name: str = "",
        to_name: str = ""
    ) -> JourneyTime:
        """Get detailed journey information from TfL API with legs"""
        # Check cache first
        cache_key = f"{from_lat:.4f},{from_lon:.4f}-{to_lat:.4f},{to_lon:.4f}"
        
        try:
            # TfL API expects coordinates in the URL path, not as query params
            url = f"https://api.tfl.gov.uk/Journey/JourneyResults/{from_lat},{from_lon}/to/{to_lat},{to_lon}"
            
            params = {
                'mode': 'tube,bus,dlr,overground,elizabeth-line,tram,walking',
                'journeyPreference': 'LeastTime',
                'accessibilityPreference': 'NoRequirements',
                'walkingSpeed': 'Average',
                'cyclePreference': 'None',
                'bikeProficiency': 'Easy'
            }
            
            if self.app_id and self.app_key:
                params['app_id'] = self.app_id
                params['app_key'] = self.app_key
            
            response = await self.client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('journeys') and len(data['journeys']) > 0:
                    journey = data['journeys'][0]  # Get the best journey
                    
                    # Parse journey legs
                    legs = []
                    total_walking_duration = 0
                    total_transfers = 0
                    
                    for leg in journey.get('legs', []):
                        mode = leg.get('mode', {}).get('name', 'unknown')
                        duration = leg.get('duration', 0)
                        
                        if mode.lower() == 'walking':
                            total_walking_duration += duration
                        elif mode.lower() in ['tube', 'bus', 'dlr', 'overground']:
                            total_transfers += 1
                        
                        # Extract line information if available
                        line_name = None
                        direction = None
                        stops = None
                        
                        if leg.get('routeOptions'):
                            route_option = leg['routeOptions'][0]
                            line_name = route_option.get('name')
                            direction = route_option.get('direction')
                        
                        if leg.get('stopPoints'):
                            stops = len(leg['stopPoints'])
                        
                        # Create instruction
                        instruction = leg.get('instruction', {}).get('summary', '')
                        if not instruction:
                            if mode.lower() == 'walking':
                                instruction = f"Walk for {duration} minutes"
                            elif line_name:
                                instruction = f"Take {line_name} line"
                                if direction:
                                    instruction += f" towards {direction}"
                                if stops:
                                    instruction += f" ({stops} stops)"
                        
                        journey_leg = JourneyLeg(
                            mode=mode,
                            from_name=leg.get('departurePoint', {}).get('commonName', ''),
                            to_name=leg.get('arrivalPoint', {}).get('commonName', ''),
                            from_coords=(
                                leg.get('departurePoint', {}).get('lat', from_lat),
                                leg.get('departurePoint', {}).get('lon', from_lon)
                            ),
                            to_coords=(
                                leg.get('arrivalPoint', {}).get('lat', to_lat),
                                leg.get('arrivalPoint', {}).get('lon', to_lon)
                            ),
                            duration=duration,
                            distance=leg.get('distance'),
                            line_name=line_name,
                            direction=direction,
                            stops=stops,
                            instruction=instruction
                        )
                        legs.append(journey_leg)
                    
                    # Parse times
                    departure_time = None
                    arrival_time = None
                    if journey.get('startDateTime'):
                        try:
                            departure_time = datetime.fromisoformat(journey['startDateTime'].replace('Z', '+00:00'))
                        except:
                            departure_time = datetime.now()
                    
                    if journey.get('arrivalDateTime'):
                        try:
                            arrival_time = datetime.fromisoformat(journey['arrivalDateTime'].replace('Z', '+00:00'))
                        except:
                            arrival_time = datetime.now() + timedelta(minutes=journey.get('duration', 30))
                    
                    result = JourneyTime(
                        from_location=from_name,
                        to_station=to_name,
                        duration_minutes=journey.get('duration', 999),
                        route_type="public_transport",
                        departure_time=departure_time,
                        arrival_time=arrival_time,
                        legs=legs,
                        total_walking_duration=total_walking_duration,
                        total_transfers=max(0, total_transfers - 1)  # Transfers = changes between transport
                    )
                    logger.info(f"Created journey with {len(legs)} legs, {total_walking_duration} min walking")
                    return result
            
            # Fallback to simple estimation
            logger.warning(f"TfL API did not return journey data, using estimation")
            return self._get_estimated_journey(from_lat, from_lon, to_lat, to_lon, from_name, to_name)
            
        except Exception as e:
            logger.error(f"Error getting TfL journey details: {str(e)}")
            return self._get_estimated_journey(from_lat, from_lon, to_lat, to_lon, from_name, to_name)
    
    async def get_journey_time(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float
    ) -> int:
        """Get just the journey time (for backward compatibility)"""
        journey = await self.get_journey_details(from_lat, from_lon, to_lat, to_lon)
        return journey.duration_minutes
    
    def _get_estimated_journey(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float,
        from_name: str = "",
        to_name: str = ""
    ) -> JourneyTime:
        """Create an estimated journey when API fails"""
        distance_km = geodesic((from_lat, from_lon), (to_lat, to_lon)).km
        
        if distance_km < 1:
            duration = 5
        elif distance_km < 3:
            duration = int(distance_km * 4 + 5)
        elif distance_km < 10:
            duration = int(distance_km * 3.5 + 8)
        else:
            duration = int(distance_km * 3 + 10)
        
        # Create a simple estimated journey with one leg
        leg = JourneyLeg(
            mode="estimated",
            from_name=from_name,
            to_name=to_name,
            from_coords=(from_lat, from_lon),
            to_coords=(to_lat, to_lon),
            duration=duration,
            distance=int(distance_km * 1000),
            instruction=f"Estimated journey of {distance_km:.1f}km"
        )
        
        return JourneyTime(
            from_location=from_name,
            to_station=to_name,
            duration_minutes=duration,
            route_type="estimated",
            legs=[leg],
            total_walking_duration=0,
            total_transfers=0
        )
    
    def _estimate_journey_time(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float
    ) -> int:
        distance_km = geodesic((from_lat, from_lon), (to_lat, to_lon)).km
        
        if distance_km < 1:
            return 5
        elif distance_km < 3:
            return int(distance_km * 4 + 5)
        elif distance_km < 10:
            return int(distance_km * 3.5 + 8)
        else:
            return int(distance_km * 3 + 10)
    
    async def close(self):
        await self.client.aclose()