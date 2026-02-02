# Jarvis Integration Framework

A modular, pluggable integration system for Jarvis, inspired by Home Assistant Integrations, Home Assistant Add-ons, and VS Code Extensions.

## Overview

The Jarvis Integration Framework provides a comprehensive system for extending Jarvis functionality without modifying the core codebase. Developers can create custom integrations to:

- Add new components or modules
- Enable or disable new features
- Connect third-party applications and services
- Handle data flow between systems
- Define and expose API routes
- Add background tasks or service hooks

## Architecture

### Core Components

1. **BaseIntegration**: Abstract base class for all integrations
2. **IntegrationManager**: Central manager for registering and orchestrating integrations
3. **IntegrationManifest**: Defines integration metadata and configuration schema
4. **IntegrationRouter**: FastAPI router for integration management endpoints
5. **Integration Database Model**: Persistent storage for integration data

## Building an Integration

### 1. Create Integration Manifest

Create a `manifest.json` file that describes your integration:

```json
{
  "id": "my_awesome_integration",
  "name": "My Awesome Integration",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "An awesome integration that does cool things",
  "category": "utilities",
  "documentation_url": "https://docs.example.com",
  "support_url": "https://support.example.com",
  "icon": "Cloud",
  "keywords": ["utility", "automation"],
  "config_schema": {
    "api_key": {
      "type": "string",
      "description": "API Key for the service",
      "required": true
    }
  },
  "home_assistant_compatible": false,
  "minimum_jarvis_version": "0.1.0"
}
```

### 2. Implement Integration Class

Create a Python class that extends `BaseIntegration`:

```python
from jarvis_integrations import BaseIntegration, IntegrationManifest
import json

class MyAwesomeIntegration(BaseIntegration):
    """My Awesome Integration implementation"""
    
    async def async_setup(self) -> bool:
        """Set up the integration"""
        try:
            # Validate configuration
            if not self.config.get('api_key'):
                return False
            
            # Initialize your integration
            # Connect to external services
            # Load data, etc.
            
            # Register services
            self.register_service(
                'fetch_data',
                self.handle_fetch_data
            )
            
            return True
        except Exception as e:
            print(f"Error setting up integration: {e}")
            return False
    
    async def async_teardown(self) -> bool:
        """Tear down the integration"""
        try:
            # Clean up resources
            # Close connections
            # Stop background tasks
            return True
        except Exception as e:
            print(f"Error tearing down integration: {e}")
            return False
    
    async def handle_fetch_data(self, **kwargs):
        """Handle the fetch_data service call"""
        api_key = self.config.get('api_key')
        # Make API call or perform action
        return {
            'success': True,
            'data': 'some_data'
        }
    
    async def get_status(self) -> dict:
        """Get integration status"""
        return {
            'id': self.id,
            'name': self.name,
            'version': self.version,
            'enabled': self.enabled,
            'healthy': True
        }
```

### 3. Register Integration

Register your integration with the manager:

```python
from jarvis_integrations import IntegrationManager, IntegrationManifest
from my_integration import MyAwesomeIntegration
import json

# Load manifest
with open('manifest.json', 'r') as f:
    manifest_data = json.load(f)

manifest = IntegrationManifest(**manifest_data)

# Create manager
manager = IntegrationManager()

# Register the integration
manager.register_integration_class(
    integration_id='my_awesome_integration',
    integration_class=MyAwesomeIntegration,
    manifest=manifest
)

# Load the integration
integration = await manager.load_integration('my_awesome_integration', config={
    'api_key': 'your-api-key'
})
```

## API Endpoints

### List Integrations

```
GET /api/integrations?skip=0&limit=50&category=utilities&enabled=true
```

Response:
```json
{
  "integrations": [
    {
      "id": "my_awesome_integration",
      "manifest_id": "my_awesome_integration",
      "name": "My Awesome Integration",
      "description": "An awesome integration",
      "author": "Your Name",
      "version": "1.0.0",
      "enabled": true,
      "installed": true,
      "status": "enabled",
      "category": "utilities",
      "icon": "Cloud",
      "config": {},
      "metadata": {},
      "installed_at": "2024-01-26T00:00:00",
      "updated_at": "2024-01-26T00:00:00"
    }
  ],
  "total": 1,
  "page": 0,
  "page_size": 50
}
```

### Get Specific Integration

```
GET /api/integrations/{integration_id}
```

### Install Integration

```
POST /api/integrations/{integration_id}/install
Content-Type: application/json

{
  "config": {
    "api_key": "your-api-key"
  }
}
```

### Uninstall Integration

```
POST /api/integrations/{integration_id}/uninstall
```

### Enable Integration

```
POST /api/integrations/{integration_id}/enable
```

### Disable Integration

```
POST /api/integrations/{integration_id}/disable
```

### Update Integration Configuration

```
PUT /api/integrations/{integration_id}
Content-Type: application/json

{
  "enabled": true,
  "config": {
    "api_key": "new-api-key"
  }
}
```

### Get Integration Status

```
GET /api/integrations/{integration_id}/status
```

### Get Integration Categories

```
GET /api/integrations/categories
```

## Frontend Integration

The `IntegrationsManager` component provides a complete UI for managing integrations:

```tsx
import { IntegrationsManager } from '@/components/integrations-manager'

export default function Settings() {
  return (
    <IntegrationsManager />
  )
}
```

### Features:

- **Grid & List Views**: Toggle between grid and list layouts
- **Search**: Search by name, description, or author
- **Category Filtering**: Filter integrations by category
- **Install/Uninstall**: Manage integration lifecycle
- **Enable/Disable**: Toggle integration state
- **View Details**: See detailed integration information
- **Configure**: Update integration settings

## Advanced Features

### Services

Integrations can register and provide services:

```python
self.register_service(
    name='send_notification',
    handler=self.handle_send_notification,
    definition=ServiceDefinition(
        name='send_notification',
        description='Send a notification',
        fields={
            'title': {'type': 'string', 'required': True},
            'message': {'type': 'string', 'required': True}
        }
    )
)

# Call service from manager
result = await manager.call_service('my_integration', 'send_notification', 
                                   title='Hello', message='World')
```

### Events

Integrations can emit and listen to events:

```python
# Register event listener
self.register_event('integration.ready', self.on_integration_ready)

# Emit event
await integration.emit_event('integration.ready', {
    'timestamp': datetime.now().isoformat()
})
```

### Background Tasks

Integrations can register background tasks:

```python
async def background_sync():
    """Periodically sync data"""
    while True:
        # Do some work
        await asyncio.sleep(300)  # Every 5 minutes

self.register_background_task(
    name='periodic_sync',
    task=background_sync,
    definition=BackgroundTaskDefinition(
        name='periodic_sync',
        description='Periodically sync data',
        interval=300,
        enabled_by_default=True
    )
)
```

## Configuration Validation

Validate integration configuration before setup:

```python
async def async_validate_config(self, config: Dict[str, Any]) -> bool:
    """Validate the integration configuration"""
    if not config.get('api_key'):
        return False
    
    if len(config['api_key']) < 10:
        return False
    
    # Additional validation logic
    return True
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully in `async_setup()` and `async_teardown()`
2. **Configuration**: Keep configuration in the manifest, not in code
3. **Documentation**: Provide clear documentation and examples
4. **Testing**: Test your integration thoroughly before publishing
5. **Logging**: Use proper logging for debugging
6. **Backwards Compatibility**: Maintain backwards compatibility across versions
7. **Security**: Never hardcode credentials; use configuration
8. **Performance**: Optimize for performance, especially in `async_setup()`

## Example: Weather Integration

```python
from jarvis_integrations import BaseIntegration
import aiohttp

class WeatherIntegration(BaseIntegration):
    """Weather integration using OpenWeatherMap API"""
    
    async def async_setup(self) -> bool:
        """Set up weather integration"""
        if not self.config.get('api_key'):
            return False
        
        self.register_service('get_weather', self.get_weather)
        self.register_service('get_forecast', self.get_forecast)
        return True
    
    async def get_weather(self, city: str) -> dict:
        """Get current weather for a city"""
        api_key = self.config['api_key']
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                return await resp.json()
    
    async def get_forecast(self, city: str) -> dict:
        """Get weather forecast for a city"""
        api_key = self.config['api_key']
        url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                return await resp.json()
    
    async def get_status(self) -> dict:
        """Get integration status"""
        return {
            'id': self.id,
            'name': self.name,
            'version': self.version,
            'enabled': self.enabled,
            'healthy': True,
            'api_configured': bool(self.config.get('api_key'))
        }
```

## Troubleshooting

### Integration Won't Load

1. Check that manifest is valid JSON
2. Verify that `async_setup()` returns `True`
3. Check logs for error messages
4. Ensure all dependencies are installed

### Configuration Not Working

1. Verify configuration matches schema in manifest
2. Check that `async_validate_config()` returns `True`
3. Use `debug=True` to get more detailed error messages

### Performance Issues

1. Optimize async operations
2. Avoid blocking calls in async functions
3. Use connection pooling for external services
4. Consider caching expensive operations

## Contributing

We welcome contributions! Please follow the guidelines:

1. Create a feature branch
2. Write tests for your integration
3. Follow the code style guidelines
4. Submit a pull request

## License

The Jarvis Integration Framework is licensed under the MIT License.
