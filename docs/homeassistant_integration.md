# Home Assistant Integration

This document describes the Home Assistant database integration for the Open WebUI backend.

## Database Schema

The integration includes the following tables that mirror the Home Assistant recorder schema:

1. `event_data` - Stores event data with hash-based deduplication
2. `event_types` - Stores event type definitions
3. `state_attributes` - Stores state attributes with hash-based deduplication
4. `states_meta` - Stores entity metadata
5. `statistics_meta` - Stores metadata for statistics
6. `recorder_runs` - Tracks recorder run information
7. `schema_changes` - Tracks database schema changes
8. `statistics_runs` - Tracks statistics run information
9. `events` - Stores Home Assistant events
10. `states` - Stores Home Assistant states
11. `statistics` - Stores long-term statistics
12. `statistics_short_term` - Stores short-term statistics
13. `migration_changes` - Tracks migration changes

## SQLAlchemy Models

All tables are implemented as SQLAlchemy ORM models in `backend/models/homeassistant.py`:

- EventData
- EventTypes
- StateAttributes
- StatesMeta
- StatisticsMeta
- RecorderRuns
- SchemaChanges
- StatisticsRuns
- Events
- States
- Statistics
- StatisticsShortTerm
- MigrationChanges

## API Endpoints

Basic CRUD operations are available under `/api/v1/homeassistant/`:

- `GET /api/v1/homeassistant/event_data` - Get all event data
- `GET /api/v1/homeassistant/event_data/{data_id}` - Get event data by ID
- `POST /api/v1/homeassistant/event_data` - Create new event data
- `PUT /api/v1/homeassistant/event_data/{data_id}` - Update event data
- `DELETE /api/v1/homeassistant/event_data/{data_id}` - Delete event data

Similar endpoints exist for `event_types`.

## Database Migrations

The integration includes an Alembic migration file that will create all necessary tables when applied:

```bash
alembic upgrade head
```

## Testing

Unit tests are included in the `tests/` directory:

- `test_homeassistant_models.py` - Tests model definitions and relationships
- `test_homeassistant_api.py` - Tests API endpoints

## Usage

To use the Home Assistant integration:

1. Ensure the database tables are created (either via migration or manual initialization)
2. Use the API endpoints to interact with Home Assistant data
3. The models can also be used directly in other parts of the application

## Manual Initialization

If needed, you can manually create the tables using the utility script:

```bash
python backend/utils/init_homeassistant.py
```

This script provides options to create or drop the Home Assistant tables.