from typing import List, Dict, Tuple
import uuid
from datetime import datetime
import logging

from app.schemas import (
    LocationInput, 
    ProcessedLocation, 
    MeetingStation, 
    JourneyTime,
    MeetingPointResponse
)
from app.services.tfl_service import TfLService
from app.services.geocoding_service import GeocodingService
from app.core.constants import LONDON_STATIONS

logger = logging.getLogger(__name__)


class MeetingCalculator:
    def __init__(self, tfl_service: TfLService, geocoding_service: GeocodingService):
        self.tfl_service = tfl_service
        self.geocoding_service = geocoding_service
    
    async def process_locations(
        self, 
        locations: List[LocationInput]
    ) -> List[ProcessedLocation]:
        processed = []
        
        for loc in locations:
            if loc.latitude and loc.longitude:
                processed_loc = ProcessedLocation(
                    name=loc.name,
                    address=loc.address,
                    latitude=loc.latitude,
                    longitude=loc.longitude
                )
            elif loc.address:
                coords = await self.geocoding_service.geocode_location(loc.address)
                if coords:
                    processed_loc = ProcessedLocation(
                        name=loc.name,
                        address=loc.address,
                        latitude=coords[0],
                        longitude=coords[1]
                    )
                else:
                    logger.warning(f"Could not geocode location: {loc.name} - {loc.address}")
                    continue
            else:
                logger.warning(f"Location {loc.name} has neither coordinates nor address")
                continue
            
            processed.append(processed_loc)
            logger.info(f"Processed location: {processed_loc.name} at ({processed_loc.latitude}, {processed_loc.longitude})")
        
        return processed
    
    async def calculate_optimal_meeting_point(
        self,
        locations: List[ProcessedLocation],
        use_tfl_api: bool = True
    ) -> Tuple[MeetingStation, List[MeetingStation]]:
        results = []
        
        for station_name, (station_lat, station_lon) in LONDON_STATIONS.items():
            total_time = 0
            max_time = 0
            journey_times = []
            
            for loc in locations:
                if use_tfl_api:
                    duration = await self.tfl_service.get_journey_time(
                        loc.latitude, loc.longitude,
                        station_lat, station_lon
                    )
                else:
                    duration = self.tfl_service._estimate_journey_time(
                        loc.latitude, loc.longitude,
                        station_lat, station_lon
                    )
                
                total_time += duration
                max_time = max(max_time, duration)
                
                journey_times.append(JourneyTime(
                    from_location=loc.name,
                    to_station=station_name,
                    duration_minutes=duration,
                    route_type="public_transport"
                ))
            
            avg_time = total_time / len(locations) if locations else 0
            min_time = min([jt.duration_minutes for jt in journey_times]) if journey_times else 0
            fairness_score = max_time - min_time
            
            station = MeetingStation(
                station_name=station_name,
                latitude=station_lat,
                longitude=station_lon,
                average_journey_time=avg_time,
                max_journey_time=max_time,
                total_journey_time=total_time,
                fairness_score=fairness_score,
                journey_times=journey_times
            )
            
            results.append(station)
        
        results.sort(key=lambda x: (x.average_journey_time, x.fairness_score))
        
        optimal = results[0] if results else None
        alternatives = results[1:6] if len(results) > 1 else []
        
        return optimal, alternatives
    
    async def find_meeting_point(
        self,
        locations: List[LocationInput],
        use_tfl_api: bool = True
    ) -> MeetingPointResponse:
        processed_locations = await self.process_locations(locations)
        
        if len(processed_locations) < 2:
            raise ValueError("Need at least 2 valid locations to find a meeting point")
        
        optimal, alternatives = await self.calculate_optimal_meeting_point(
            processed_locations, 
            use_tfl_api
        )
        
        if not optimal:
            raise ValueError("Could not calculate optimal meeting point")
        
        center_lat = sum(loc.latitude for loc in processed_locations) / len(processed_locations)
        center_lon = sum(loc.longitude for loc in processed_locations) / len(processed_locations)
        
        return MeetingPointResponse(
            request_id=str(uuid.uuid4()),
            created_at=datetime.utcnow(),
            optimal_station=optimal,
            alternative_stations=alternatives,
            processed_locations=processed_locations,
            map_center=(center_lat, center_lon)
        )