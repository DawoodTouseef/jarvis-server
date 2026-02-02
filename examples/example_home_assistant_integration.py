"""
Example Integration: Home Assistant Companion

This integration demonstrates Home Assistant integration and service calling.
Use this as a template for building Home Assistant compatible integrations.
"""

from jarvis_integrations import BaseIntegration
from typing import Dict, Any, Optional
import aiohttp


class HomeAssistantCompanionIntegration(BaseIntegration):
    """
    Home Assistant Companion Integration
    
    Provides integration with Home Assistant instances through its API.
    """

    async def async_setup(self) -> bool:
        """Set up the Home Assistant companion integration"""
        try:
            # Validate configuration
            if not await self.async_validate_config(self.config):
                return False
            
            # Register services
            self.register_service('call_service', self.call_ha_service)
            self.register_service('get_entities', self.get_entities)
            self.register_service('get_state', self.get_state)
            self.register_service('set_state', self.set_state)
            
            # Verify connection
            entities = await self.get_entities()
            if not entities.get('success'):
                return False
            
            return True
        except Exception as e:
            print(f"Error setting up HomeAssistantCompanionIntegration: {e}")
            return False

    async def async_teardown(self) -> bool:
        """Tear down the integration"""
        try:
            # No cleanup needed
            return True
        except Exception as e:
            print(f"Error tearing down HomeAssistantCompanionIntegration: {e}")
            return False

    async def async_validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate configuration"""
        # Check required fields
        if not config.get('host'):
            return False
        if not config.get('token'):
            return False
        
        # Verify we can connect
        try:
            url = f"http://{config['host']}/api/config"
            headers = {'Authorization': f"Bearer {config['token']}"}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    return resp.status == 200
        except Exception:
            return False

    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for Home Assistant API"""
        return {
            'Authorization': f"Bearer {self.config['token']}",
            'Content-Type': 'application/json',
        }

    def _get_base_url(self) -> str:
        """Get base URL for Home Assistant API"""
        protocol = self.config.get('protocol', 'http')
        host = self.config['host']
        port = self.config.get('port', '')
        
        if port:
            return f"{protocol}://{host}:{port}/api"
        return f"{protocol}://{host}/api"

    async def get_entities(self, **kwargs) -> Dict[str, Any]:
        """Get all entities from Home Assistant"""
        try:
            url = f"{self._get_base_url()}/states"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as resp:
                    if resp.status == 200:
                        states = await resp.json()
                        return {
                            'success': True,
                            'entities': states,
                            'count': len(states),
                        }
                    return {
                        'success': False,
                        'error': f"HTTP {resp.status}",
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    async def get_state(self, entity_id: str, **kwargs) -> Dict[str, Any]:
        """Get the state of a specific entity"""
        try:
            url = f"{self._get_base_url()}/states/{entity_id}"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as resp:
                    if resp.status == 200:
                        state = await resp.json()
                        return {
                            'success': True,
                            'state': state,
                        }
                    return {
                        'success': False,
                        'error': f"HTTP {resp.status}",
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    async def set_state(self, entity_id: str, state: str, **kwargs) -> Dict[str, Any]:
        """Set the state of a specific entity"""
        try:
            url = f"{self._get_base_url()}/states/{entity_id}"
            headers = self._get_headers()
            
            payload = {
                'state': state,
                'attributes': kwargs.get('attributes', {}),
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status in (200, 201):
                        result = await resp.json()
                        return {
                            'success': True,
                            'state': result,
                        }
                    return {
                        'success': False,
                        'error': f"HTTP {resp.status}",
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    async def call_ha_service(
        self,
        domain: str,
        service: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Call a Home Assistant service"""
        try:
            url = f"{self._get_base_url()}/services/{domain}/{service}"
            headers = self._get_headers()
            
            # Extract service data
            service_data = {k: v for k, v in kwargs.items() if k not in ['entity_ids']}
            
            payload = {
                'entity_id': kwargs.get('entity_ids', []),
                **service_data,
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status in (200, 201):
                        result = await resp.json()
                        return {
                            'success': True,
                            'result': result,
                        }
                    return {
                        'success': False,
                        'error': f"HTTP {resp.status}",
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    async def get_status(self) -> Dict[str, Any]:
        """Get the integration status"""
        try:
            # Try to get config to verify connection
            url = f"{self._get_base_url()}/../config"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    healthy = resp.status == 200
            
            return {
                'id': self.id,
                'name': self.name,
                'version': self.version,
                'enabled': self.enabled,
                'healthy': healthy,
                'host': self.config.get('host'),
                'services': list(self._services.keys()),
            }
        except Exception:
            return {
                'id': self.id,
                'name': self.name,
                'version': self.version,
                'enabled': self.enabled,
                'healthy': False,
            }
