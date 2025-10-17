from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import Tuple, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeocodingService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent=settings.geocoder_user_agent)
    
    async def geocode_location(self, location: str) -> Optional[Tuple[float, float]]:
        try:
            if "london" not in location.lower() and "uk" not in location.lower():
                location = f"{location}, London, UK"
            
            result = self.geolocator.geocode(location, timeout=10)
            
            if result:
                logger.info(f"Successfully geocoded: {location}")
                return (result.latitude, result.longitude)
            else:
                logger.warning(f"Could not geocode location: {location}")
                return None
                
        except GeocoderTimedOut:
            logger.error(f"Geocoding timeout for location: {location}")
            return None
        except GeocoderServiceError as e:
            logger.error(f"Geocoding service error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected geocoding error: {str(e)}")
            return None
    
    async def reverse_geocode(self, lat: float, lon: float) -> Optional[str]:
        try:
            result = self.geolocator.reverse((lat, lon), timeout=10)
            
            if result:
                return result.address
            return None
            
        except Exception as e:
            logger.error(f"Reverse geocoding error: {str(e)}")
            return None