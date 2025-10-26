# Home Assistant Controllers

This document explains how to use the separate controller classes for each Home Assistant database table.

## Overview

Instead of having one monolithic controller for all Home Assistant tables, we've created individual controllers for each table following the same pattern as other table controllers in the project (like `AuthsTable`, `UsersTable`, etc.).

## Available Controllers

Each controller provides CRUD operations for its respective table:

1. `EventsCtrl` - For the `Events` table
2. `StatesCtrl` - For the `States` table
3. `StatisticsCtrl` - For the `Statistics` table
4. `StatesMetaCtrl` - For the `StatesMeta` table
5. `EventDataCtrl` - For the `EventData` table
6. `EventTypesCtrl` - For the `EventTypes` table
7. `StateAttributesCtrl` - For the `StateAttributes` table
8. `StatisticsMetaCtrl` - For the `StatisticsMeta` table
9. `RecorderRunsCtrl` - For the `RecorderRuns` table
10. `SchemaChangesCtrl` - For the `SchemaChanges` table
11. `MigrationChangesCtrl` - For the `MigrationChanges` table
12. `StatisticsShortTermCtrl` - For the `StatisticsShortTerm` table
13. `StatisticsRunsCtrl` - For the `StatisticsRuns` table

## Usage Examples

### Importing Controllers

```python
from backend.models.home_assistant_controllers import (
    EventsCtrl, StatesCtrl, StatisticsCtrl, StatesMetaCtrl,
    EventDataCtrl, EventTypesCtrl, StateAttributesCtrl,
    StatisticsMetaCtrl, RecorderRunsCtrl, SchemaChangesCtrl,
    MigrationChangesCtrl, StatisticsShortTermCtrl, StatisticsRunsCtrl
)
```

### Creating an Event

```python
# Create a new event
event = EventsCtrl.create_event(
    event_type="state_changed",
    event_data={"entity_id": "light.kitchen", "new_state": "on"},
    origin="LOCAL"
)

if event:
    print(f"Created event with ID: {event.event_id}")
```

### Creating a State

```python
# Create a new state
state = StatesCtrl.create_state(
    entity_id="light.kitchen",
    state="on",
    attributes={"brightness": 100, "color": "white"}
)

if state:
    print(f"Created state with ID: {state.state_id}")
```

### Getting Entity Metadata

```python
# Get or create entity metadata
meta = StatesMetaCtrl.get_or_create_entity_metadata("light.kitchen")
if meta:
    print(f"Entity metadata ID: {meta.metadata_id}")
```

### Getting All Entity IDs

```python
# Get all entity IDs
entities = StatesMetaCtrl.get_all_entity_ids()
print(f"Found {len(entities)} entities: {entities}")
```

## Controller Methods

Each controller follows the standard pattern with methods like:

- `create_*` - Create new records
- `get_*_by_id` - Get records by ID
- `get_*_by_*` - Get records by other criteria
- `update_*` - Update existing records
- `delete_*` - Delete records

## Running Tests

To verify the controllers work correctly:

```bash
python tests/test_home_assistant_controllers.py
python tests/test_home_assistant_router.py
```

## Integration with Routers

See `backend/routers/home_assistant_example.py` for an example of how to use these controllers in FastAPI routers.