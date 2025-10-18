# Bruno API Tests

API test collection for Where2Meet backend using Bruno.

## Setup

1. Install Bruno CLI:
```bash
npm install -g @usebruno/cli
```

Or use npx (no installation needed):
```bash
npx @usebruno/cli run --env local
```

2. Install Bruno GUI (optional but recommended):
- Download from: https://www.usebruno.com/downloads

## Running Tests

### Against local server:
```bash
# Start the API first
make run

# In another terminal
make bruno-test
```

### Against Docker:
```bash
# Start Docker services
make docker-up

# Run tests
make bruno-test-docker
```

## Test Structure

```
bruno-tests/
├── environments/       # Environment configurations
│   ├── local.bru      # Local development
│   └── docker.bru     # Docker environment
├── health/            # Health check endpoints
│   ├── Health Check.bru
│   └── Readiness Check.bru
└── meeting-points/    # Meeting point calculations
    ├── Get All Stations.bru
    ├── Geocode Address.bru
    ├── Calculate Meeting Point - Basic.bru
    ├── Calculate Meeting Point - Mixed Input.bru
    └── Calculate Meeting Point - Error Cases.bru
```

## Available Tests

### Health Checks
- **Health Check**: Verifies API is running and healthy
- **Readiness Check**: Checks all subsystems are ready

### Meeting Points
- **Get All Stations**: Lists all available London stations
- **Geocode Address**: Converts address to coordinates
- **Calculate Meeting Point - Basic**: Simple 2-location calculation
- **Calculate Meeting Point - Mixed**: Handles address and coordinate inputs
- **Error Cases**: Tests validation and error handling

## Environment Variables

Configured in `environments/*.bru`:
- `baseUrl`: API base URL (default: http://localhost:8000)
- `apiPrefix`: API path prefix (default: /api)

## Adding New Tests

1. Create a new `.bru` file in the appropriate folder
2. Use the Bruno GUI or edit the file directly
3. Follow the existing naming convention
4. Add assertions and test scripts as needed

## CI/CD Integration

To run in CI/CD pipeline:
```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run all tests
bruno run --env docker

# Run specific folder
bruno run meeting-points/ --env docker
```