#!/usr/bin/env python3
"""
Test script to inspect journey path data from TfL API
Specifically looking at Victoria line between Euston and Victoria
"""

import asyncio
import json
from app.services.tfl_service import TfLService
from app.services.geocoding_service import GeocodingService

async def main():
    # Initialize services
    tfl = TfLService()
    geocoding = GeocodingService()
    
    # Get coordinates for Euston and Victoria
    print("Getting coordinates...")
    euston_coords = await geocoding.geocode_location("Euston Station, London")
    victoria_coords = await geocoding.geocode_location("Victoria Station, London")
    
    if not euston_coords or not victoria_coords:
        print("Failed to geocode stations")
        return
    
    print(f"Euston: {euston_coords}")
    print(f"Victoria: {victoria_coords}")
    print("\n" + "="*80 + "\n")
    
    # Get journey details
    print("Fetching journey from TfL API...")
    journey = await tfl.get_journey_details(
        euston_coords[0], euston_coords[1],
        victoria_coords[0], victoria_coords[1],
        "Euston", "Victoria"
    )
    
    print(f"\nTotal journey time: {journey.duration_minutes} minutes")
    print(f"Number of legs: {len(journey.legs)}")
    print("\n" + "="*80 + "\n")
    
    # Inspect each leg
    for i, leg in enumerate(journey.legs):
        print(f"\nLEG {i+1}:")
        print(f"  Mode: {leg.mode}")
        print(f"  Line: {leg.line_name}")
        print(f"  From: {leg.from_name}")
        print(f"  To: {leg.to_name}")
        print(f"  From coords: {leg.from_coords}")
        print(f"  To coords: {leg.to_coords}")
        print(f"  Duration: {leg.duration} minutes")
        print(f"  Stops: {leg.stops}")
        
        # Check intermediate stops
        if leg.intermediate_stops:
            print(f"  Intermediate stops: {len(leg.intermediate_stops)} points")
            # Show first few and last few
            if len(leg.intermediate_stops) > 6:
                print("    First 3 points:")
                for j, point in enumerate(leg.intermediate_stops[:3]):
                    print(f"      {j+1}: {point}")
                print("    ...")
                print("    Last 3 points:")
                for j, point in enumerate(leg.intermediate_stops[-3:], len(leg.intermediate_stops)-3):
                    print(f"      {j+1}: {point}")
            else:
                for j, point in enumerate(leg.intermediate_stops):
                    print(f"    {j+1}: {point}")
            
            # Check for potential duplicates or very close points
            if len(leg.intermediate_stops) > 1:
                print("\n  Checking for close/duplicate points:")
                for j in range(len(leg.intermediate_stops) - 1):
                    curr = leg.intermediate_stops[j]
                    next = leg.intermediate_stops[j + 1]
                    # Calculate rough distance
                    lat_diff = abs(curr[0] - next[0])
                    lon_diff = abs(curr[1] - next[1])
                    if lat_diff < 0.0001 and lon_diff < 0.0001:
                        print(f"    VERY CLOSE: Points {j+1} and {j+2} are within 0.0001 degrees")
                        print(f"      Point {j+1}: {curr}")
                        print(f"      Point {j+2}: {next}")
        else:
            print(f"  No intermediate stops")
        
        print("-" * 40)
    
    # Also get the raw API response to inspect the path data
    print("\n" + "="*80 + "\n")
    print("Getting raw TfL API response...")
    
    import aiohttp
    url = f"https://api.tfl.gov.uk/Journey/JourneyResults/{euston_coords[0]},{euston_coords[1]}/to/{victoria_coords[0]},{victoria_coords[1]}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
            
            if data.get('journeys'):
                first_journey = data['journeys'][0]
                print(f"\nRaw journey has {len(first_journey.get('legs', []))} legs")
                
                for i, leg in enumerate(first_journey.get('legs', [])):
                    mode = leg.get('mode', {}).get('name', 'unknown')
                    print(f"\nRaw Leg {i+1} - {mode}:")
                    
                    if leg.get('path'):
                        path = leg['path']
                        if path.get('lineString'):
                            coords = json.loads(path['lineString'])
                            print(f"  LineString has {len(coords)} coordinates")
                            
                            # Check if it's a tube leg
                            if 'tube' in mode.lower() or 'underground' in mode.lower():
                                print("  This is a TUBE leg - checking for potential issues:")
                                
                                # Show sample of coordinates
                                print(f"    First 5 coords: {coords[:5]}")
                                print(f"    Last 5 coords: {coords[-5:]}")
                                
                                # Check for back-and-forth patterns
                                if len(coords) > 10:
                                    print("\n  Checking for direction changes:")
                                    lat_changes = []
                                    lon_changes = []
                                    for j in range(len(coords) - 1):
                                        lat_changes.append(coords[j+1][0] - coords[j][0])
                                        lon_changes.append(coords[j+1][1] - coords[j][1])
                                    
                                    # Count direction changes
                                    lat_dir_changes = sum(1 for j in range(len(lat_changes)-1) 
                                                         if lat_changes[j] * lat_changes[j+1] < 0)
                                    lon_dir_changes = sum(1 for j in range(len(lon_changes)-1) 
                                                         if lon_changes[j] * lon_changes[j+1] < 0)
                                    
                                    print(f"    Latitude direction changes: {lat_dir_changes}")
                                    print(f"    Longitude direction changes: {lon_dir_changes}")
                                    
                                    if lat_dir_changes > 5 or lon_dir_changes > 5:
                                        print("    WARNING: Many direction changes detected - might cause visual issues!")

if __name__ == "__main__":
    asyncio.run(main())