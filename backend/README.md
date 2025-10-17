# Where2Meet Backend API

FastAPI backend service for the Where2Meet application - finding optimal meeting points in London using TfL journey data.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the server:
```bash
python run.py
# or
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Main Endpoints

### Calculate Meeting Point
`POST /api/meeting-points/calculate`

Request body:
```json
{
  "locations": [
    {"name": "Alice", "address": "Victoria Station, London"},
    {"name": "Bob", "latitude": 51.5074, "longitude": -0.1278}
  ],
  "use_tfl_api": true
}
```

### Get All Stations
`GET /api/meeting-points/stations`

### Geocode Address
`POST /api/meeting-points/geocode?address=Victoria Station, London`

### Health Check
`GET /api/health/`

## Architecture

- **FastAPI** - Modern Python web framework
- **TfL API** - Real-time journey planning
- **Geopy** - Address geocoding
- **Pydantic** - Data validation
- **Supabase** - Database (configured but not yet integrated)

## Testing

```bash
pytest tests/
```

## Next Steps

1. Integrate Supabase for data persistence
2. Add user authentication
3. Implement saved meeting points
4. Add WebSocket support for real-time updates