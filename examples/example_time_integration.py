"""
Example Integration: Time and Date Service

This is a simple example integration that provides time and date services.
Use this as a template for building your own integrations.
"""

from jarvis_integrations import BaseIntegration
from datetime import datetime, timezone
from typing import Dict, Any


class TimeAndDateIntegration(BaseIntegration):
    """
    Time and Date Integration
    
    Provides services for getting current time and date in different formats.
    """

    async def async_setup(self) -> bool:
        """Set up the time and date integration"""
        try:
            # Register services
            self.register_service('get_current_time', self.get_current_time)
            self.register_service('get_current_date', self.get_current_date)
            self.register_service('get_datetime', self.get_datetime)
            self.register_service('get_timestamp', self.get_timestamp)
            
            return True
        except Exception as e:
            print(f"Error setting up TimeAndDateIntegration: {e}")
            return False

    async def async_teardown(self) -> bool:
        """Tear down the integration"""
        try:
            # No cleanup needed for this simple integration
            return True
        except Exception as e:
            print(f"Error tearing down TimeAndDateIntegration: {e}")
            return False

    async def async_validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate configuration - this integration needs no config"""
        return True

    async def get_current_time(self, **kwargs) -> Dict[str, Any]:
        """Get the current time"""
        now = datetime.now()
        return {
            'success': True,
            'time': now.strftime('%H:%M:%S'),
            'timezone': 'local',
            'hour': now.hour,
            'minute': now.minute,
            'second': now.second,
        }

    async def get_current_date(self, **kwargs) -> Dict[str, Any]:
        """Get the current date"""
        now = datetime.now()
        return {
            'success': True,
            'date': now.strftime('%Y-%m-%d'),
            'formatted': now.strftime('%A, %B %d, %Y'),
            'year': now.year,
            'month': now.month,
            'day': now.day,
        }

    async def get_datetime(self, format: str = '%Y-%m-%d %H:%M:%S', **kwargs) -> Dict[str, Any]:
        """Get current date and time in specified format"""
        now = datetime.now()
        return {
            'success': True,
            'datetime': now.strftime(format),
            'iso_format': now.isoformat(),
            'timestamp': now.timestamp(),
        }

    async def get_timestamp(self, **kwargs) -> Dict[str, Any]:
        """Get current Unix timestamp"""
        now = datetime.now()
        return {
            'success': True,
            'timestamp': int(now.timestamp()),
            'timestamp_float': now.timestamp(),
            'utc_datetime': now.astimezone(timezone.utc).isoformat(),
        }

    async def get_status(self) -> Dict[str, Any]:
        """Get the integration status"""
        return {
            'id': self.id,
            'name': self.name,
            'version': self.version,
            'enabled': self.enabled,
            'healthy': True,
            'services': list(self._services.keys()),
        }
