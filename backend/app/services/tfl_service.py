import httpx
from typing import Tuple, Optional
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)


class TfLService:
    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        self.base_url = "https://api.tfl.gov.uk/Journey/JourneyResults"
        self.app_id = app_id
        self.app_key = app_key
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_journey_time(
        self, 
        from_lat: float, 
        from_lon: float, 
        to_lat: float, 
        to_lon: float
    ) -> int:
        try:
            params = {
                'from': f'{from_lat},{from_lon}',
                'to': f'{to_lat},{to_lon}',
                'mode': 'tube,bus,dlr,overground,elizabeth-line,tram',
                'journeyPreference': 'LeastTime',
                'accessibilityPreference': 'NoRequirements',
                'walkingSpeed': 'Average'
            }
            
            if self.app_id and self.app_key:
                params['app_id'] = self.app_id
                params['app_key'] = self.app_key
            
            response = await self.client.get(self.base_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('journeys') and len(data['journeys']) > 0:
                    duration = data['journeys'][0].get('duration', 999)
                    logger.info(f"TfL API returned journey time: {duration} minutes")
                    return duration
            else:
                logger.warning(f"TfL API returned status {response.status_code}")
            
            return self._estimate_journey_time(from_lat, from_lon, to_lat, to_lon)
            
        except Exception as e:
            logger.error(f"Error getting TfL journey time: {str(e)}")
            return self._estimate_journey_time(from_lat, from_lon, to_lat, to_lon)
    
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