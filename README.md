# Where2Meet

A web application for finding the optimal meeting point in London based on multiple starting locations, using TfL journey data to calculate the fairest spot for everyone.

## Project Structure

```
where2meet/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend service
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend without Docker)

### Running the Application

1. **Start the Backend (Docker)**
   ```bash
   cd backend
   docker-compose down && docker-compose up --build -d
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

## Important: Development Workflow

### Backend Changes

When making changes to the backend code while using Docker:

1. **For most Python code changes** (business logic in `/app` directory):
   - Changes should auto-reload if using development Docker setup
   - If not reflected, restart: `docker-compose restart`

2. **For Pydantic schema/model changes or structural changes**:
   - **MUST rebuild the container:**
   ```bash
   cd backend
   docker-compose down && docker-compose up --build -d
   ```

3. **For dependency changes** (requirements.txt):
   - **Always rebuild with no cache:**
   ```bash
   cd backend
   docker-compose build --no-cache && docker-compose up -d
   ```

### Frontend Changes

Frontend uses Next.js with hot module replacement - changes are reflected immediately.

## Features

- 🗺️ Interactive map showing all locations and suggested meeting points
- 🚇 Real-time TfL journey planning integration
- ⚖️ Fairness scoring system (discrete ratings: Very Fair, Fair, Moderate, Somewhat Unfair, Unfair)
- 📍 Support for both address-based and coordinate-based location input
- 🎯 Multiple alternative meeting point suggestions
- 🚶 Detailed journey breakdown with walking times and transfers

## Tech Stack

### Backend
- FastAPI (Python web framework)
- TfL Unified API (journey planning)
- Geopy (geocoding)
- Docker (containerization)
- Pydantic (data validation)

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS (styling)
- Leaflet (interactive maps)
- Shadcn/ui (UI components)

## API Endpoints

Main endpoints:
- `POST /api/meeting-points/calculate` - Calculate optimal meeting point
- `GET /api/meeting-points/stations` - Get all London stations
- `POST /api/meeting-points/geocode` - Geocode an address
- `GET /api/health/` - Health check

## Development

See individual README files in `/frontend` and `/backend` directories for detailed development instructions.

### Common Issues & Solutions

1. **Backend changes not reflected:**
   - Rebuild Docker: `cd backend && docker-compose down && docker-compose up --build -d`

2. **Port already in use:**
   - Check running containers: `docker ps`
   - Stop conflicting containers: `docker stop <container_id>`

3. **Frontend can't connect to backend:**
   - Ensure backend is running on port 8000
   - Check CORS settings in backend
   - Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## License

MIT