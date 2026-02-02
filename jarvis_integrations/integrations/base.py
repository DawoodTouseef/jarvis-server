"""
Base integration class for building integrations.
"""

import inspect
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Coroutine
from pydantic import BaseModel, Field
from .schemas import IntegrationManifest, ServiceDefinition, EventDefinition, BackgroundTaskDefinition


class IntegrationConfig(BaseModel):
    """Base configuration class for integrations."""

    pass


class BaseIntegration(ABC):
    """
    Base class for all integrations.
    
    Developers should extend this class to create custom integrations.
    Inspired by Home Assistant Integrations and VS Code Extensions.
    """

    def __init__(self, manifest: IntegrationManifest, config: Dict[str, Any] = None):
        """
        Initialize the integration.

        Args:
            manifest: The integration manifest
            config: Configuration dictionary for the integration
        """
        self.manifest = manifest
        self.config = config or {}
        self._enabled = True
        self._services: Dict[str, callable] = {}
        self._events: Dict[str, List[callable]] = {}
        self._background_tasks: Dict[str, callable] = {}

    @property
    def id(self) -> str:
        """Get the integration ID."""
        return self.manifest.id

    @property
    def name(self) -> str:
        """Get the integration name."""
        return self.manifest.name

    @property
    def version(self) -> str:
        """Get the integration version."""
        return self.manifest.version

    @property
    def author(self) -> str:
        """Get the integration author."""
        return self.manifest.author

    @property
    def description(self) -> str:
        """Get the integration description."""
        return self.manifest.description

    @property
    def enabled(self) -> bool:
        """Check if integration is enabled."""
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool):
        """Set integration enabled state."""
        self._enabled = value

    async def async_setup(self) -> bool:
        """
        Set up the integration asynchronously.

        Should be overridden by subclasses to perform initialization.

        Returns:
            True if setup was successful, False otherwise
        """
        return True

    async def async_teardown(self) -> bool:
        """
        Tear down the integration asynchronously.

        Should be overridden by subclasses to perform cleanup.

        Returns:
            True if teardown was successful, False otherwise
        """
        return True

    async def async_validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate the integration configuration.

        Args:
            config: Configuration to validate

        Returns:
            True if configuration is valid, False otherwise
        """
        return True

    def register_service(self, name: str, handler: callable, definition: Optional[ServiceDefinition] = None):
        """
        Register a service provided by this integration.

        Args:
            name: Service name
            handler: Callable that handles the service call
            definition: Service definition with metadata
        """
        self._services[name] = handler

    def register_event(self, event_name: str, handler: callable, definition: Optional[EventDefinition] = None):
        """
        Register an event listener for this integration.

        Args:
            event_name: Name of the event to listen for
            handler: Callable that handles the event
            definition: Event definition with metadata
        """
        if event_name not in self._events:
            self._events[event_name] = []
        self._events[event_name].append(handler)

    def register_background_task(self, name: str, task: callable, definition: Optional[BackgroundTaskDefinition] = None):
        """
        Register a background task for this integration.

        Args:
            name: Task name
            task: Async callable that performs the task
            definition: Background task definition with metadata
        """
        self._background_tasks[name] = task

    async def call_service(self, service_name: str, **kwargs) -> Any:
        """
        Call a registered service.

        Args:
            service_name: Name of the service to call
            **kwargs: Service parameters

        Returns:
            Service result
        """
        if service_name not in self._services:
            raise ValueError(f"Service '{service_name}' not found")

        handler = self._services[service_name]
        if inspect.iscoroutinefunction(handler):
            return await handler(**kwargs)
        else:
            return handler(**kwargs)

    async def emit_event(self, event_name: str, data: Dict[str, Any] = None):
        """
        Emit an event from this integration.

        Args:
            event_name: Name of the event
            data: Event data
        """
        if event_name in self._events:
            for handler in self._events[event_name]:
                if inspect.iscoroutinefunction(handler):
                    await handler(data or {})
                else:
                    handler(data or {})

    def get_services(self) -> Dict[str, callable]:
        """Get all registered services."""
        return self._services.copy()

    def get_events(self) -> Dict[str, List[callable]]:
        """Get all registered events."""
        return self._events.copy()

    def get_background_tasks(self) -> Dict[str, callable]:
        """Get all registered background tasks."""
        return self._background_tasks.copy()

    def get_config(self) -> Dict[str, Any]:
        """Get the integration configuration."""
        return self.config.copy()

    def update_config(self, config: Dict[str, Any]):
        """Update the integration configuration."""
        self.config.update(config)

    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the integration.

        Should be overridden by subclasses.

        Returns:
            Status dictionary
        """
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "enabled": self.enabled,
            "healthy": True,
        }

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id} version={self.version}>"
