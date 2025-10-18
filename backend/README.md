# Where2Meet Backend API

FastAPI backend service for the Where2Meet application - finding optimal meeting points in London using TfL journey data.

## Quick Start

### Using Make (Recommended)
```bash
# Complete setup and run
make quick-start

# Or with Docker
make quick-docker
```

### Manual Setup
```bash
# Setup environment
make setup

# Run locally
make run

# Run with Docker
make docker-up
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

### Unit Tests
```bash
make test
```

### API Tests with Bruno
```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run tests
make bruno-test
```

## Docker

### Build and Run
```bash
# Production
make docker-build
make docker-up

# Development (with hot reload)
make docker-dev

# View logs
make docker-logs
```

## Available Make Commands

Run `make help` to see all available commands:
- `make setup` - Complete project setup
- `make run` - Run API locally
- `make dev` - Run with auto-reload
- `make test` - Run tests
- `make docker-up` - Start with Docker
- `make docker-dev` - Start development Docker
- `make bruno-test` - Run API tests
- `make clean` - Clean cache files

## Next Steps

1. Integrate Supabase for data persistence
2. Add user authentication
3. Implement saved meeting points
4. Add WebSocket support for real-time updates