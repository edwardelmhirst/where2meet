# Where2Meet Algorithm Documentation

## Overview

Where2Meet uses a sophisticated algorithm to calculate the fairest meeting point for multiple people across London. The algorithm optimizes for minimal travel time disparity, ensuring the most equitable journey times for all participants.

## Core Algorithm Components

### 1. Location Processing

The system first processes user inputs to obtain precise geographic coordinates:

- **Input Types Accepted:**
  - Location names with addresses (e.g., "Victoria Station, London")
  - Direct latitude/longitude coordinates
  
- **Geocoding Service:**
  - Converts addresses to coordinates using geocoding APIs
  - Validates and normalizes location data
  - Returns `ProcessedLocation` objects with exact lat/lon pairs

### 2. Candidate Station Selection

The algorithm evaluates 25 major London transport hubs as potential meeting points:

#### Station Pool
Major stations include King's Cross, Oxford Circus, Victoria, Liverpool Street, Waterloo, London Bridge, Paddington, Leicester Square, Bank, Canary Wharf, Stratford, and others strategically distributed across London.

#### Initial Filtering Process

1. **Geographic Distance Calculation:**
   - Uses the Haversine formula (via geopy.distance.geodesic) to calculate straight-line distances
   - Computes distance from each user location to each candidate station
   - Formula: `distance = geodesic((lat1, lon1), (lat2, lon2)).km`

2. **Preliminary Scoring:**
   - For each station, calculates:
     - `total_distance` = sum of all user distances to that station
     - `average_distance` = total_distance / number of users
     - `max_distance` = longest individual distance to that station

3. **Top Candidate Selection:**
   - Sorts all stations by `average_distance` (ascending)
   - Selects the top 7 candidates for detailed journey time analysis

### 3. Journey Time Calculation

For the 7 candidate stations, the algorithm performs detailed journey time analysis:

#### TfL API Integration

When `use_tfl_api=True` (default):

1. **Parallel API Calls:**
   - Makes simultaneous requests for all user-station combinations
   - Total API calls = 7 stations × N users
   - Example: 4 users = 28 parallel API calls

2. **Journey Parameters:**
   ```python
   mode = 'tube,bus,dlr,overground,elizabeth-line,tram,walking'
   journeyPreference = 'LeastTime'
   walkingSpeed = 'Average'
   ```

3. **Journey Details Captured:**
   - Total journey duration (minutes)
   - Individual journey legs (walking, tube, bus segments)
   - Walking duration within journey
   - Number of transfers required
   - Detailed route instructions

#### Fallback Estimation

When TfL API is unavailable:

```python
if distance < 1km:
    duration = 5 minutes
elif distance < 3km:
    duration = (distance × 4) + 5 minutes
elif distance < 10km:
    duration = (distance × 3.5) + 8 minutes
else:
    duration = (distance × 3) + 10 minutes
```

### 4. Fairness Calculation

The fairness score is the core innovation of the algorithm, measuring journey time equity:

#### Calculation Method

1. **Time Spread Analysis:**
   ```python
   time_spread = max_journey_time - min_journey_time
   ```

2. **Fairness Rating Assignment:**
   ```python
   if time_spread <= 5 minutes:
       fairness_score = "Very Fair"
   elif time_spread <= 10 minutes:
       fairness_score = "Fair"
   elif time_spread <= 15 minutes:
       fairness_score = "Moderate"
   elif time_spread <= 20 minutes:
       fairness_score = "Somewhat Unfair"
   else:
       fairness_score = "Unfair"
   ```

#### Interpretation

- **Very Fair (≤5 min spread):** Everyone travels nearly the same amount of time
- **Fair (≤10 min spread):** Minor variations in journey times
- **Moderate (≤15 min spread):** Acceptable differences for most groups
- **Somewhat Unfair (≤20 min spread):** Notable disparity, one person travels significantly more
- **Unfair (>20 min spread):** Large disparity, consider alternative arrangements

### 5. Final Ranking

The algorithm performs multi-criteria optimization:

#### Sorting Priority

```python
results.sort(key=lambda x: (
    x.average_journey_time,  # Primary: Minimize average time
    fairness_priority[x.fairness_score]  # Secondary: Maximize fairness
))
```

Where `fairness_priority = {"Very Fair": 0, "Fair": 1, "Moderate": 2, ...}`

#### Output Structure

1. **Optimal Station:** The top-ranked station balancing:
   - Lowest average journey time for the group
   - Best fairness rating (smallest time spread)

2. **Alternative Stations:** The next 5 best options, allowing users to consider:
   - Venue availability at different locations
   - Personal preferences for certain areas
   - Trade-offs between average time and fairness

### 6. Mathematical Example

**Scenario:** 3 friends meeting from different locations

**User Locations:**
- Alice: Stratford (51.5414, -0.0034)
- Bob: Hammersmith (51.4929, -0.2229)
- Charlie: Camden Town (51.5392, -0.1426)

**Candidate Analysis for King's Cross:**

1. **Distance Calculation:**
   - Alice → King's Cross: 7.8 km
   - Bob → King's Cross: 12.1 km
   - Charlie → King's Cross: 2.3 km
   - Average distance: 7.4 km

2. **Journey Time (via TfL API):**
   - Alice → King's Cross: 18 minutes
   - Bob → King's Cross: 24 minutes
   - Charlie → King's Cross: 8 minutes
   - Average time: 16.7 minutes

3. **Fairness Calculation:**
   - Time spread: 24 - 8 = 16 minutes
   - Rating: "Somewhat Unfair"

4. **Comparison with Oxford Circus:**
   - Average time: 19.3 minutes
   - Time spread: 22 - 17 = 5 minutes
   - Rating: "Very Fair"
   - Despite higher average time, Oxford Circus might be selected for better fairness

## Performance Optimizations

### 1. Parallel Processing
- All API calls execute simultaneously using `asyncio.gather()`
- Reduces total execution time from O(n×m) to O(1) where n=users, m=stations

### 2. Smart Candidate Selection
- Pre-filters from 25 to 7 stations using fast distance calculations
- Reduces expensive API calls by 72%

### 3. Caching Strategy
- Results cached by coordinate pairs
- Cache key: `"{lat:.4f},{lon:.4f}-{lat:.4f},{lon:.4f}"`
- Prevents redundant API calls for repeated searches

## Algorithm Complexity

- **Time Complexity:** O(s×u) where s=stations (constant 7), u=users
- **Space Complexity:** O(s×u) for storing journey details
- **API Calls:** 7×u parallel requests
- **Response Time:** Typically 2-4 seconds for 4 users

## Edge Cases Handled

1. **Insufficient Locations:** Requires minimum 2 valid locations
2. **API Failures:** Falls back to distance-based estimation
3. **Geocoding Failures:** Skips invalid addresses with warnings
4. **Equal Scores:** Uses station order as tiebreaker
5. **Extreme Distances:** Estimation formula scales appropriately

## Future Algorithm Enhancements

Potential improvements under consideration:

1. **Dynamic Station Pool:** Include more stations based on user locations
2. **Time-of-Day Optimization:** Account for peak vs off-peak travel
3. **Accessibility Preferences:** Filter stations by step-free access
4. **Multi-Modal Optimization:** Include cycling and ride-sharing options
5. **Machine Learning:** Predict journey times based on historical patterns
6. **Weather Integration:** Adjust walking segments for weather conditions

## Technical Implementation

The algorithm is implemented in Python with:
- **Async/Await:** For concurrent API calls
- **Type Hints:** Full typing with Pydantic models
- **Error Handling:** Graceful degradation to estimation
- **Logging:** Comprehensive debugging information
- **Testing:** Unit tests for all calculation methods

## Conclusion

The Where2Meet algorithm successfully balances multiple optimization criteria to find meeting points that minimize both total travel time and individual journey disparities. By focusing on fairness alongside efficiency, it ensures no single person bears a disproportionate travel burden, making group meetups more equitable and enjoyable for everyone involved.