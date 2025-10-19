# Algorithm Enhancement Roadmap

## Current Implementation

### Fixed Station Pool Approach (CURRENT)
The system currently uses a hardcoded list of 25 major London stations.

**How it works:**
1. Calculate geographic distance from each user to all 25 stations
2. Sort stations by average distance
3. Select top 7 candidates
4. Make TfL API calls for these 7 stations
5. Rank by average journey time and fairness score

**Pros:**
- ✅ Simple and predictable
- ✅ Fast initial filtering (geographic distance)
- ✅ Covers major transport hubs
- ✅ Limited API calls (7 stations × N users)

**Cons:**
- ❌ Poor for localized groups (e.g., all users in South London)
- ❌ Misses optimal local stations
- ❌ Central London bias (most stations in Zone 1)
- ❌ No awareness of express routes
- ❌ Geographic distance ≠ travel time

**Performance:**
- API Calls: 7 × N users (e.g., 28 calls for 4 users)
- Response Time: 2-4 seconds
- Coverage: ~25 stations across London

---

## Proposed Enhancements

### Approach 1: Adaptive Station Selection

**Concept:** Dynamically adjust the station pool based on user clustering and spread.

**Implementation:**
```python
# Pseudo-code structure
if users_are_clustered(< 3km):
    search_local_stations(including_minor_stations)
elif users_form_distinct_clusters():
    search_between_clusters()
else:
    use_grid_sampling_approach()
```

**Key Features:**
- Comprehensive station database (~500 stations)
- Dynamic search radius
- Includes bus stops and minor stations for local searches
- Grid-based sampling for distributed users

**Pros:**
- ✅ Excellent for local groups
- ✅ Finds optimal nearby stations
- ✅ Scales to all of London
- ✅ Handles edge cases well

**Cons:**
- ❌ Requires large station database
- ❌ More complex clustering analysis
- ❌ May select geographically close but poorly connected stations
- ❌ Doesn't account for express routes

**Performance:**
- API Calls: 8-15 × N users (adaptive)
- Database Size: ~500 stations
- Complexity: O(s×u) where s=stations, u=users

**Best For:**
- Local meetups (friends in same area)
- Outer London users
- Groups with clear geographic clusters

---

### Approach 2: Network-Aware Dynamic Selection

**Concept:** Use transport network topology to find truly optimal stations regardless of geographic distance.

**Implementation:**
```python
# Build transport graph
transport_graph = {
    'station': {
        'connections': [...],
        'lines': [...],
        'journey_times': {...}
    }
}

# Use graph algorithms
reachable_stations = dijkstra_within_time_radius(45_minutes)
optimal = maximize_network_centrality(reachable_stations)
```

**Key Features:**
- Pre-computed transport network graph
- Reachability analysis (time-based, not distance)
- Express route awareness
- Betweenness centrality scoring
- Barrier detection (Thames, parks)

**Pros:**
- ✅ Finds non-obvious optimal stations
- ✅ Accounts for express routes (e.g., Heathrow Express)
- ✅ Handles geographic barriers (Thames)
- ✅ Network centrality optimization

**Cons:**
- ❌ Requires maintaining network graph
- ❌ Journey times become stale
- ❌ Doesn't account for real-time delays
- ❌ Complex graph algorithms
- ❌ High memory usage for graph

**Performance:**
- API Calls: 10-12 × N users
- Memory: ~50MB for network graph
- Preprocessing: Required graph building
- Complexity: O(V log V) for Dijkstra per user

**Best For:**
- Users on express routes
- Cross-Thames journeys
- Long-distance meetups
- Users at transport periphery

---

### Approach 3: Hybrid Approach (RECOMMENDED)

**Concept:** Combine lightweight topology analysis with real-time TfL API validation.

**Implementation:**
```python
# Phase 1: Topology-based selection (no API)
candidates = select_via_topology(
    user_entry_points,
    network_structure,  # Just connections, no times
    express_routes
)

# Phase 2: Real-time validation (focused API calls)
results = await validate_with_tfl_api(
    candidates[:8],  # Only check top candidates
    include_disruptions=True
)
```

**Key Features:**
- Two-phase approach (topology → validation)
- Minimal precomputed data (just network structure)
- Adaptive API budget (5-12 stations based on complexity)
- Real-time disruption handling
- Fallback exploration if results are poor

**Pros:**
- ✅ Best of both worlds
- ✅ Real-time accuracy
- ✅ 60-70% fewer API calls
- ✅ Handles disruptions/delays
- ✅ Express route awareness
- ✅ Minimal precomputation

**Cons:**
- ❌ Most complex implementation
- ❌ Requires both systems
- ❌ Two-phase latency

**Performance:**
- API Calls: 5-12 × N users (adaptive)
- Memory: ~5MB for topology
- Response Time: 1-2 seconds
- API Reduction: 68% vs naive approach

**Best For:**
- All use cases
- Production deployment
- Scalability requirements

---

## Detailed Comparison Matrix

| Aspect | Current (Fixed Pool) | Adaptive | Network-Aware | Hybrid |
|--------|---------------------|----------|---------------|---------|
| **API Calls (4 users)** | 28 | 32-60 | 40-48 | 20-48 |
| **Response Time** | 2-4s | 2-5s | 3-5s | 1-2s |
| **Memory Usage** | ~1MB | ~10MB | ~50MB | ~5MB |
| **Implementation Complexity** | Low | Medium | High | High |
| **Maintenance** | Low | Medium | High | Medium |
| **Local Groups** | Poor | Excellent | Good | Excellent |
| **Long Distance** | Good | Good | Excellent | Excellent |
| **Express Routes** | Poor | Poor | Excellent | Excellent |
| **Real-time Delays** | Yes | Yes | No | Yes |
| **Geographic Barriers** | Poor | Fair | Excellent | Excellent |
| **Scalability** | Good | Fair | Fair | Excellent |

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)
1. **Expand station pool** from 25 to 50 stations
   - Add outer London hubs
   - Include major interchanges
   - Minimal code change

2. **Improve fairness scoring**
   - Add standard deviation metric
   - Weight max journey time higher
   - Better "Unfair" detection

### Phase 2: Adaptive Selection (2-3 weeks)
1. **Build station database**
   - All tube stations (270)
   - Major rail/overground (110)
   - Store with zones

2. **Implement clustering detection**
   - Geographic spread analysis
   - Local search for close groups
   - Expand search radius adaptively

3. **Testing with edge cases**
   - All users in one area
   - Users at extremes
   - Cross-Thames scenarios

### Phase 3: Hybrid Approach (4-6 weeks)
1. **Build lightweight topology**
   - Station connections only
   - Express route mapping
   - Interchange scores

2. **Implement two-phase algorithm**
   - Topology pre-selection
   - Real-time validation
   - Adaptive budgeting

3. **Add intelligent fallbacks**
   - Disruption avoidance
   - Alternative strategies
   - Result quality checks

### Phase 4: Optimization (2 weeks)
1. **Caching layer**
   - Recent searches
   - Common routes
   - Station metadata

2. **Performance tuning**
   - Parallel processing
   - Query optimization
   - Response streaming

---

## Technical Specifications

### Data Structures Needed

#### Station Database
```json
{
  "station_id": "victoria",
  "name": "Victoria",
  "coordinates": [51.4952, -0.1439],
  "zone": 1,
  "lines": ["Victoria", "Circle", "District"],
  "facilities": ["step_free", "toilets"],
  "interchange_score": 9
}
```

#### Network Topology
```json
{
  "victoria": {
    "connections": [
      {"station": "green_park", "lines": ["Victoria"]},
      {"station": "sloane_square", "lines": ["Circle", "District"]}
    ],
    "express_routes": [],
    "typical_frequency": {"peak": 2, "off_peak": 4}
  }
}
```

#### User Clustering Result
```json
{
  "pattern": "localized|multi_cluster|distributed",
  "clusters": [
    {
      "center": [51.5, -0.1],
      "radius_km": 2.5,
      "users": [0, 1, 2]
    }
  ],
  "recommended_strategy": "local_search"
}
```

### API Optimization Strategies

1. **Batching**
   - Group all station×user combinations
   - Single `asyncio.gather()` call
   - Parallel execution

2. **Intelligent Budgeting**
   ```python
   if spread < 3km and users <= 3:
       api_budget = 5 stations
   elif spread > 15km or users > 5:
       api_budget = 12 stations
   else:
       api_budget = 8 stations
   ```

3. **Caching**
   - Cache key: `f"{lat:.3f},{lon:.3f}-{lat:.3f},{lon:.3f}"`
   - TTL: 5 minutes (for delays/disruptions)
   - LRU eviction

4. **Fallback Estimation**
   - When API fails/times out
   - Distance-based calculation
   - Historical average adjustments

---

## Recommendations

### Immediate Action (Do Now)
1. Expand station pool to 50 stations (quick win)
2. Document current API usage patterns
3. Add logging for algorithm performance

### Short Term (Next Sprint)
1. Implement basic clustering detection
2. Add more outer London stations
3. Improve fairness calculation

### Medium Term (Next Quarter)
1. Build hybrid approach (recommended)
2. Add express route awareness
3. Implement intelligent fallbacks

### Long Term (Future)
1. Machine learning for journey prediction
2. Multi-modal transport (bike, scooter)
3. User preference learning
4. Cost optimization options

---

## Success Metrics

### Performance KPIs
- API calls per search: Target < 40 for 4 users
- Response time: Target < 2 seconds
- Result quality: > 90% user satisfaction

### Algorithm Quality
- Fairness improvement: 30% more "Fair" results
- Local optimization: Find best station within 1km for local groups
- Express utilization: Detect and use express routes when optimal

### Business Impact
- User retention: Reduced abandonment
- API costs: 50% reduction
- Scalability: Handle 10x current load

---

## Risk Analysis

### Technical Risks
1. **TfL API Changes**
   - Mitigation: Abstract API layer
   - Fallback: Distance estimation

2. **Performance Degradation**
   - Mitigation: Caching layer
   - Monitoring: Response time alerts

3. **Data Staleness**
   - Mitigation: Real-time validation
   - Update frequency: Daily for topology

### Implementation Risks
1. **Complexity Creep**
   - Mitigation: Phased approach
   - Testing: Comprehensive edge cases

2. **Backwards Compatibility**
   - Mitigation: Feature flags
   - Rollback: Keep current algorithm

---

## Conclusion

**Recommended Approach:** Implement the Hybrid Approach in phases:
1. Start with quick wins (expand station pool)
2. Build adaptive selection for local groups
3. Add topology intelligence
4. Optimize with caching and performance tuning

This provides the best balance of:
- Real-time accuracy
- API efficiency  
- Implementation feasibility
- User experience improvement

The phased approach allows for incremental improvements while maintaining system stability and learning from each phase before proceeding to the next.