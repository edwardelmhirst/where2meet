from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Tuple
from datetime import datetime


class LocationInput(BaseModel):
    name: str = Field(..., description="Name or identifier for this location")
    address: Optional[str] = Field(None, description="Address or place name")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Home",
                "address": "Victoria Station, London"
            }
        }


class ProcessedLocation(BaseModel):
    name: str
    address: Optional[str]
    latitude: float
    longitude: float


class JourneyLeg(BaseModel):
    mode: str  # tube, bus, walking, etc.
    from_name: str
    to_name: str
    from_coords: Tuple[float, float]  # lat, lon
    to_coords: Tuple[float, float]
    duration: int  # minutes
    distance: Optional[int] = None  # meters
    line_name: Optional[str] = None  # e.g., "Victoria", "Northern"
    direction: Optional[str] = None
    stops: Optional[int] = None  # number of stops
    instruction: str  # e.g., "Take Victoria line towards Brixton"

class JourneyTime(BaseModel):
    from_location: str
    to_station: str
    duration_minutes: int
    route_type: str = "public_transport"
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    legs: List[JourneyLeg] = []
    total_walking_duration: int = 0
    total_transfers: int = 0


class MeetingStation(BaseModel):
    station_name: str
    latitude: float
    longitude: float
    average_journey_time: float
    max_journey_time: float
    total_journey_time: float
    fairness_score: float
    journey_times: List[JourneyTime]


class MeetingPointRequest(BaseModel):
    locations: List[LocationInput] = Field(..., min_length=2, max_length=10)
    use_tfl_api: bool = Field(True, description="Use TfL API for accurate journey times")
    preferences: Optional[Dict] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "locations": [
                    {"name": "Alice", "address": "Victoria Station, London"},
                    {"name": "Bob", "address": "Notting Hill Gate, London"},
                    {"name": "Charlie", "latitude": 51.5074, "longitude": -0.1278}
                ],
                "use_tfl_api": True
            }
        }


class MeetingPointResponse(BaseModel):
    request_id: str
    created_at: datetime
    optimal_station: MeetingStation
    alternative_stations: List[MeetingStation]
    processed_locations: List[ProcessedLocation]
    map_center: Tuple[float, float]
    
    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2024-01-01T12:00:00",
                "optimal_station": {
                    "station_name": "Oxford Circus",
                    "latitude": 51.5152,
                    "longitude": -0.1415,
                    "average_journey_time": 15.5,
                    "max_journey_time": 20,
                    "total_journey_time": 46.5,
                    "fairness_score": 8,
                    "journey_times": []
                },
                "alternative_stations": [],
                "processed_locations": [],
                "map_center": [51.5074, -0.1278]
            }
        }


class SavedMeetingPoint(BaseModel):
    id: str
    user_id: Optional[str]
    name: str
    description: Optional[str]
    meeting_data: MeetingPointResponse
    created_at: datetime
    updated_at: datetime
    is_public: bool = False
    share_token: Optional[str]