from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.schemas import (
    MeetingPointRequest,
    MeetingPointResponse,
    LocationInput
)
from app.services import TfLService, GeocodingService, MeetingCalculator
from app.core.config import settings

router = APIRouter()

tfl_service = TfLService(settings.tfl_app_id, settings.tfl_app_key)
geocoding_service = GeocodingService()
meeting_calculator = MeetingCalculator(tfl_service, geocoding_service)


@router.post("/calculate", response_model=MeetingPointResponse)
async def calculate_meeting_point(request: MeetingPointRequest):
    try:
        result = await meeting_calculator.find_meeting_point(
            request.locations,
            request.use_tfl_api
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/geocode")
async def geocode_address(address: str):
    try:
        coords = await geocoding_service.geocode_location(address)
        if coords:
            return {
                "address": address,
                "latitude": coords[0],
                "longitude": coords[1]
            }
        else:
            raise HTTPException(status_code=404, detail="Could not geocode address")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")


@router.get("/stations")
async def get_stations():
    from app.core.constants import LONDON_STATIONS
    
    stations = [
        {
            "name": name,
            "latitude": coords[0],
            "longitude": coords[1]
        }
        for name, coords in LONDON_STATIONS.items()
    ]
    
    return {"stations": stations, "total": len(stations)}