# Quick Start: Building Your First Integration

This guide will help you create your first Jarvis integration in minutes.

## Step 1: Create Your Integration Directory

```bash
mkdir -p your_integration/
cd your_integration/
```

## Step 2: Create the Manifest

Create `manifest.json`:

```json
{
  "id": "my_first_integration",
  "name": "My First Integration",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "My first Jarvis integration",
  "category": "utilities",
  "icon": "Zap",
  "keywords": ["example", "tutorial"],
  "config_schema": {
    "setting_one": {
      "type": "string",
      "required": true,
      "description": "First setting"
    },
    "setting_two": {
      "type": "string",
      "required": false,
      "description": "Optional setting"
    }
  }
}
```

## Step 3: Create the Integration Class

Create `integration.py`:

```python
from jarvis_integrations import BaseIntegration
from typing import Dict, Any

class MyFirstIntegration(BaseIntegration):
    """My first integration for Jarvis"""
    
    async def async_setup(self) -> bool:
        """Set up the integration"""
        print(f"Setting up {self.name}")
        
        # Validate we have required config
        if not self.config.get('setting_one'):
            print("Missing required setting: setting_one")
            return False
        
        # Register your services
        self.register_service('say_hello', self.say_hello)
        self.register_service('process_data', self.process_data)
        
        return True
    
    async def async_teardown(self) -> bool:
        """Clean up"""
        print(f"Tearing down {self.name}")
        return True
    
    async def say_hello(self, name: str = "World", **kwargs) -> Dict[str, Any]:
        """A simple hello service"""
        return {
            "success": True,
            "message": f"Hello, {name}!",
            "setting": self.config.get('setting_one')
        }
    
    async def process_data(self, data: str, **kwargs) -> Dict[str, Any]:
        """Process some data"""
        return {
            "success": True,
            "original": data,
            "processed": data.upper(),
            "length": len(data)
        }
    
    async def get_status(self) -> Dict[str, Any]:
        """Return integration status"""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "enabled": self.enabled,
            "healthy": True,
            "services": list(self._services.keys())
        }
```

## Step 4: Register Your Integration (In Backend Code)

```python
from jarvis_integrations import IntegrationManager, IntegrationManifest
from your_integration.integration import MyFirstIntegration
import json

# Load manifest
with open('your_integration/manifest.json', 'r') as f:
    manifest_data = json.load(f)

manifest = IntegrationManifest(**manifest_data)

# Create manager (usually done in main.py)
manager = IntegrationManager()

# Register your integration
manager.register_integration_class(
    integration_id='my_first_integration',
    integration_class=MyFirstIntegration,
    manifest=manifest
)
```

## Step 5: Test Your Integration

### Using the Frontend

1. Go to Settings → Integrations
2. Find "My First Integration"
3. Click "Install"
4. Configure the settings if prompted
5. Click "Enable"
6. Check the status

### Using the API

```bash
# List integrations
curl http://localhost:8000/api/integrations

# Install
curl -X POST http://localhost:8000/api/integrations/my_first_integration/install \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "setting_one": "my_value"
    }
  }'

# Call a service (if implemented in backend)
curl -X POST http://localhost:8000/api/integrations/my_first_integration/services/say_hello \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice"
  }'
```

### Using Python

```python
import asyncio
from jarvis_integrations import IntegrationManager, IntegrationManifest
from your_integration.integration import MyFirstIntegration
import json

async def main():
    # Load manifest
    with open('manifest.json', 'r') as f:
        manifest_data = json.load(f)
    
    manifest = IntegrationManifest(**manifest_data)
    
    # Create manager
    manager = IntegrationManager()
    
    # Register
    manager.register_integration_class(
        'my_first_integration',
        MyFirstIntegration,
        manifest
    )
    
    # Load integration
    integration = await manager.load_integration(
        'my_first_integration',
        config={
            'setting_one': 'test_value',
            'setting_two': 'optional_value'
        }
    )
    
    # Call a service
    result = await integration.call_service('say_hello', name='Bob')
    print(result)  # {'success': True, 'message': 'Hello, Bob!', ...}
    
    # Get status
    status = await integration.get_status()
    print(status)

asyncio.run(main())
```

## Step 6: Enhance Your Integration

### Add Configuration Validation

```python
async def async_validate_config(self, config: Dict[str, Any]) -> bool:
    """Validate configuration"""
    setting_one = config.get('setting_one', '')
    
    # Check length
    if len(setting_one) < 3:
        return False
    
    # Check format
    if not setting_one.isalnum():
        return False
    
    return True
```

### Add Events

```python
# Register event listener
self.register_event('integration.ready', self.on_ready)

async def on_ready(self, data: Dict[str, Any]):
    """Called when integration is ready"""
    print(f"Integration is ready! Data: {data}")

# Emit event
await self.emit_event('integration.ready', {
    'timestamp': datetime.now().isoformat()
})
```

### Add Background Tasks

```python
import asyncio

async def sync_data_task(self):
    """Periodically sync data"""
    while True:
        try:
            # Do some work
            print("Syncing data...")
            await asyncio.sleep(300)  # Every 5 minutes
        except Exception as e:
            print(f"Error in sync task: {e}")

# Register in async_setup
self.register_background_task('sync_data', self.sync_data_task)
```

## Full Example Structure

```
my_integration/
├── manifest.json
├── integration.py
├── __init__.py
├── README.md
└── requirements.txt
```

## Common Patterns

### Connect to External Service

```python
import aiohttp

class ExternalServiceIntegration(BaseIntegration):
    async def async_setup(self) -> bool:
        api_key = self.config.get('api_key')
        if not api_key:
            return False
        
        self.register_service('get_data', self.fetch_from_service)
        return True
    
    async def fetch_from_service(self, query: str, **kwargs):
        url = "https://api.example.com/data"
        headers = {'Authorization': f"Bearer {self.config['api_key']}"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params={'q': query}, headers=headers) as resp:
                if resp.status == 200:
                    return {
                        'success': True,
                        'data': await resp.json()
                    }
                return {
                    'success': False,
                    'error': f"HTTP {resp.status}"
                }
```

### Store State

```python
class StatefulIntegration(BaseIntegration):
    def __init__(self, manifest, config=None):
        super().__init__(manifest, config)
        self.state = {}
    
    async def async_setup(self) -> bool:
        self.state = {
            'counter': 0,
            'items': []
        }
        self.register_service('increment', self.increment_counter)
        self.register_service('get_counter', self.get_counter)
        return True
    
    async def increment_counter(self, **kwargs):
        self.state['counter'] += 1
        return {'counter': self.state['counter']}
    
    async def get_counter(self, **kwargs):
        return {'counter': self.state['counter']}
```

### Handle Errors Gracefully

```python
async def async_setup(self) -> bool:
    try:
        # Validate configuration
        config = self.config
        
        # Try to connect to external service
        if not await self._test_connection():
            return False
        
        # Register services
        self.register_service('do_something', self.do_something)
        
        return True
    except Exception as e:
        print(f"Setup error: {e}")
        return False

async def _test_connection(self) -> bool:
    try:
        # Test external connection
        return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

async def do_something(self, **kwargs):
    try:
        # Do work
        return {'success': True, 'result': 'done'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
```

## Tips & Best Practices

1. **Always validate configuration** in `async_setup()`
2. **Use try/except** in async methods
3. **Implement `async_validate_config()`** for runtime validation
4. **Log important events** for debugging
5. **Make `get_status()` informative** - include useful data
6. **Use type hints** for better IDE support
7. **Document your services** with docstrings
8. **Keep async operations fast** - offload heavy work
9. **Handle external service failures** gracefully
10. **Test both happy and error paths**

## Debugging

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class DebugIntegration(BaseIntegration):
    async def async_setup(self) -> bool:
        logger.debug(f"Setup called with config: {self.config}")
        # ...
```

### Check Integration Status

```python
# Via API
curl http://localhost:8000/api/integrations/my_first_integration/status

# Via Python
status = await manager.get_integration_status('my_first_integration')
print(status)
```

### View Logs

Check your application logs for:
- Integration setup/teardown messages
- Service call errors
- Configuration validation failures
- External service errors

## Next Steps

1. Check the [full INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for advanced topics
2. Review [example integrations](./examples/) for real-world patterns
3. Build more complex integrations
4. Share your integration with the community!

## Support

- 📖 Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for comprehensive docs
- 📚 Check [examples/](./examples/) for reference implementations
- 🐛 Check logs for error details
- 💬 Ask questions in the community forum

Happy integrating! 🚀
