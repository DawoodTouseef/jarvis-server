# Backend API Documentation

This document provides information about the backend API endpoints available in the Jarvis server.

## Home Assistant REST API

The Jarvis server includes a Home Assistant-compatible REST API that mirrors the endpoints and behavior from the Home Assistant REST API documentation.

### Endpoints

All Home Assistant endpoints are prefixed with `/api/v1/homeassistant` and are tagged as "HomeAssistant" in the OpenAPI documentation.

#### System / Info Endpoints

- `GET /api/v1/homeassistant/` - Returns a simple message indicating the API is running
- `GET /api/v1/homeassistant/health` - Simple database health check
- `GET /api/v1/homeassistant/config` - Return application configuration summary
- `GET /api/v1/homeassistant/components` - Return list of loaded components
- `GET /api/v1/homeassistant/overview` - Return counts of various entities in the system

#### Events Endpoints

- `GET /api/v1/homeassistant/events` - Return array of event objects with event types and listener counts
- `GET /api/v1/homeassistant/events/{event_id}` - Return single event by ID
- `GET /api/v1/homeassistant/events/recent` - Get recent events with optional filtering and pagination
- `POST /api/v1/homeassistant/events` - Create a new event
- `DELETE /api/v1/homeassistant/events/{event_id}` - Delete an event by ID

#### States Endpoints

- `GET /api/v1/homeassistant/states` - Return list of current states
- `GET /api/v1/homeassistant/states/{entity_id}` - Return the latest state for an entity
- `POST /api/v1/homeassistant/states/{entity_id}` - Create or update state for an entity
- `DELETE /api/v1/homeassistant/states/{entity_id}` - Delete all states for an entity

#### History Endpoints

- `GET /api/v1/homeassistant/history/period` - Return state history for entities
- `GET /api/v1/homeassistant/history/period/{timestamp}` - Return state history for entities from a specific timestamp

#### Services Endpoints

- `GET /api/v1/homeassistant/services` - Return array of domain objects and their services
- `POST /api/v1/homeassistant/services/{domain}/{service}` - Call a service within a specific domain

#### Statistics Endpoints

- `GET /api/v1/homeassistant/statistics/meta` - Return list of statistics metadata
- `GET /api/v1/homeassistant/statistics/{metadata_id}` - Return statistics for a metadata ID with time range filtering
- `GET /api/v1/homeassistant/statistics/short_term/{metadata_id}` - Return short-term statistics for a metadata ID

#### Recorder Endpoints

- `GET /api/v1/homeassistant/recorder/runs` - Return recorder runs
- `GET /api/v1/homeassistant/schema/changes` - Return schema changes
- `GET /api/v1/homeassistant/migration/changes` - Return migration changes

### Authentication

All endpoints require an Authentication header `Authorization: Bearer <TOKEN>`. For testing purposes, any non-empty token will work.

### Sample Usage

```bash
# Get API root
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/v1/homeassistant/

# Create a state
curl -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"state":"on","attributes":{"brightness":100}}' \
  http://localhost:8000/api/v1/homeassistant/states/light.test

# Create an event
curl -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"event_type":"state_changed","event_data":{"entity_id":"light.test","new_state":"on"},"origin":"LOCAL"}' \
  http://localhost:8000/api/v1/homeassistant/events

# Get state history
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/homeassistant/history/period?filter_entity_id=light.test"
```

### Database Models

The Home Assistant API uses the following SQLAlchemy models defined in `backend/models/homeassistant.py`:

- `EventData` - Stores event data
- `EventTypes` - Stores event types
- `StateAttributes` - Stores state attributes
- `StatesMeta` - Stores entity metadata
- `StatisticsMeta` - Stores statistics metadata
- `RecorderRuns` - Stores recorder run information
- `SchemaChanges` - Stores schema changes
- `StatisticsRuns` - Stores statistics run information
- `Events` - Stores events
- `States` - Stores states
- `Statistics` - Stores statistics
- `StatisticsShortTerm` - Stores short-term statistics
- `MigrationChanges` - Stores migration changes

These models are mapped to database tables that follow the Home Assistant database schema.