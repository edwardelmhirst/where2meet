import httpx
from typing import Tuple, Optional
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)


class TfLService:
    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        self.app_id = app_id
        self.app_key = app_key
        self.client = httpx.AsyncClient(timeout=30.0)
        self._cache = {}  # Simple in-memory cache
    
    async def get_journey_time(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float
    ) -> int:
        # Check cache first
        cache_key = f"{from_lat:.4f},{from_lon:.4f}-{to_lat:.4f},{to_lon:.4f}"
        if cache_key in self._cache:
            logger.debug(f"Cache hit for journey {cache_key}")
            return self._cache[cache_key]
        
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
                    duration = data['journeys'][0].get('duration', 999)
                    logger.info(f"TfL API returned journey time: {duration} minutes")
                    # Cache the result
                    self._cache[cache_key] = duration
                    return duration
            elif response.status_code == 300:
                # Multiple routes available, just use estimate
                logger.info("TfL API returned multiple routes, using estimate")
            else:
                logger.warning(f"TfL API returned status {response.status_code}: {response.text[:200]}")
            
            # Use estimate and cache it
            estimate = self._estimate_journey_time(from_lat, from_lon, to_lat, to_lon)
            self._cache[cache_key] = estimate
            return estimate
            
        except Exception as e:
            logger.error(f"Error getting TfL journey time: {str(e)}")
            estimate = self._estimate_journey_time(from_lat, from_lon, to_lat, to_lon)
            self._cache[cache_key] = estimate
            return estimate
    
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