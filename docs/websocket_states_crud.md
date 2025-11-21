# WebSocket CRUD Operations for States Table

This document describes the WebSocket CRUD operations added for the States table in the Home Assistant integration.

## Overview

Four new WebSocket event handlers have been added to enable real-time CRUD (Create, Read, Update, Delete) operations on the States table:

1. `states:create` - Create a new state
2. `states:get` - Retrieve a state by entity ID
3. `states:update` - Update an existing state
4. `states:delete` - Delete a state by ID

## Authentication

All operations require a valid authenticated WebSocket connection. The user must be authenticated when establishing the WebSocket connection.

## Operations

### 1. Create State (`states:create`)

Create a new state in the database.

**Request:**
```json
{
  "type": "states:create",
  "entity_id": "string",
  "state": "string",
  "attributes": { }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "on",
    "attributes": { },
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 2. Get State (`states:get`)

Retrieve the latest state for a specific entity ID.

**Request:**
```json
{
  "type": "states:get",
  "entity_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "on",
    "attributes": { },
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 3. Update State (`states:update`)

Update an existing state by its ID.

**Request:**
```json
{
  "type": "states:update",
  "state_id": 123,
  "state": "string", (optional)
  "attributes": { } (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "state_id": 123,
    "entity_id": "light.test_light",
    "state": "off",
    "attributes": { },
    "last_changed": "2023-01-01T00:00:00Z",
    "last_updated": "2023-01-01T00:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 4. Delete State (`states:delete`)

Delete a state by its ID.

**Request:**
```json
{
  "type": "states:delete",
  "state_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "State 123 deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Real-time Updates

When a state is created, updated, or deleted, a `state_changed` event is automatically emitted to all connected clients:

```json
{
  "type": "state_changed",
  "data": {
    "entity_id": "light.test_light",
    "new_state": {
      "state": "on",
      "attributes": { }
    }
  }
}
```

## Example Usage

### JavaScript/TypeScript Client Example

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/api/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  // Handle responses
  if (data.type === 'states:create:response') {
    if (data.success) {
      console.log('State created:', data.data);
    } else {
      console.error('Failed to create state:', data.error);
    }
  }
};

// Create a new state
const createState = () => {
  const message = {
    type: 'states:create',
    entity_id: 'light.living_room',
    state: 'on',
    attributes: {
      brightness: 100
    }
  };
  ws.send(JSON.stringify(message));
};

// Get a state
const getState = () => {
  const message = {
    type: 'states:get',
    entity_id: 'light.living_room'
  };
  ws.send(JSON.stringify(message));
};
```

## Backend Implementation

The WebSocket CRUD operations are implemented in `backend/socket/main.py` with the following functions:

- `create_state(sid, data)` - Handles `states:create` events
- `get_state(sid, data)` - Handles `states:get` events
- `update_state(sid, data)` - Handles `states:update` events
- `delete_state(sid, data)` - Handles `states:delete` events

Each function includes proper error handling and authentication checks.