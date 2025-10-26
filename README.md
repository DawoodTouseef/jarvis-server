# Home Assistant Backend API

This is a FastAPI implementation of the Home Assistant backend API for the Jarvis project.

## API Endpoints

### State Management APIs

- `GET /api/states` - Get all current entity states
- `GET /api/states/{entity_id}` - Get current state of a specific entity
- `POST /api/states/{entity_id}` - Set/update state of an entity
- `GET /api/states/{entity_id}/history` - Get historical states for an entity

### Event APIs

- `GET /api/events` - Get recent events
- `POST /api/events/{event_type}` - Fire a new event

### Service Call APIs

- `POST /api/services/{domain}/{service}` - Call a service (e.g., turn on a light)

### Entity Registry APIs

- `GET /api/registry/entities` - Get all registered entities
- `POST /api/registry/entities` - Register a new entity
- `GET /api/registry/entities/{entity_id}` - Get entity registry entry

### Device Registry APIs

- `GET /api/registry/devices` - Get all registered devices
- `POST /api/registry/devices` - Register a new device

### Area Registry APIs

- `GET /api/registry/areas` - Get all areas/rooms
- `POST /api/registry/areas` - Create a new area

### Statistics APIs

- `GET /api/statistics/{statistic_id}` - Get statistics for an entity
- `POST /api/statistics/{statistic_id}` - Record statistics manually

### Recorder APIs

- `GET /api/recorder/info` - Get current recorder run information
- `POST /api/recorder/purge` - Purge old data

## Database Models

The API uses the following database models:

- `RecorderRuns` - Manages recorder sessions
- `States` - Stores entity states
- `Events` - Stores system events
- `StatisticsLongTerm` - Stores long-term statistics
- `StatisticsShortTermData` - Stores short-term statistics
- `EntityRegistry` - Manages entity registration
- `DeviceRegistry` - Manages device registration
- `AreaRegistry` - Manages area/room registration

## Installation

1. Make sure you have Python 3.8+ installed
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Server

To run the server in development mode:
```
uvicorn backend.main:app --reload
```

The API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

To run the tests:
```
pytest tests/test_homeassistant_api.py
```