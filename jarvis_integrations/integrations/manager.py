"""
Integration Manager for managing and orchestrating integrations.
"""

import inspect
import logging
from typing import Any, Dict, List, Optional, Type
from datetime import datetime

from .base import BaseIntegration
from .schemas import IntegrationManifest, IntegrationSchema, IntegrationStatus
from .exceptions import (
    IntegrationError,
    IntegrationNotFoundError,
    IntegrationAlreadyExistsError,
    IntegrationValidationError,
)

logger = logging.getLogger(__name__)


class IntegrationManager:
    """
    Manager for registering, loading, and managing integrations.

    Inspired by Home Assistant's integration system and VS Code's extension manager.
    """

    def __init__(self):
        """Initialize the integration manager."""
        self._integrations: Dict[str, BaseIntegration] = {}
        self._manifests: Dict[str, IntegrationManifest] = {}
        self._schemas: Dict[str, IntegrationSchema] = {}
        self._registry: Dict[str, Type[BaseIntegration]] = {}

    def register_integration_class(
        self,
        integration_id: str,
        integration_class: Type[BaseIntegration],
        manifest: IntegrationManifest,
    ):
        """
        Register an integration class.

        Args:
            integration_id: Unique integration ID
            integration_class: The integration class (must extend BaseIntegration)
            manifest: Integration manifest

        Raises:
            IntegrationAlreadyExistsError: If integration already registered
            IntegrationValidationError: If integration class is invalid
        """
        if integration_id in self._registry:
            raise IntegrationAlreadyExistsError(
                f"Integration '{integration_id}' is already registered"
            )

        if not issubclass(integration_class, BaseIntegration):
            raise IntegrationValidationError(
                f"Integration class must extend BaseIntegration"
            )

        self._registry[integration_id] = integration_class
        self._manifests[integration_id] = manifest

        logger.info(f"Registered integration class: {integration_id}")

    async def load_integration(
        self,
        integration_id: str,
        config: Dict[str, Any] = None,
    ) -> BaseIntegration:
        """
        Load and initialize an integration.

        Args:
            integration_id: ID of the integration to load
            config: Configuration for the integration

        Returns:
            The loaded integration instance

        Raises:
            IntegrationNotFoundError: If integration not registered
            IntegrationError: If initialization fails
        """
        if integration_id not in self._registry:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' not found in registry"
            )

        if integration_id in self._integrations:
            return self._integrations[integration_id]

        try:
            integration_class = self._registry[integration_id]
            manifest = self._manifests[integration_id]
            config = config or {}

            # Create instance
            integration = integration_class(manifest, config)

            # Setup the integration
            success = await integration.async_setup()
            if not success:
                raise IntegrationError(
                    f"Failed to set up integration '{integration_id}'"
                )

            # Store the integration
            self._integrations[integration_id] = integration

            logger.info(f"Loaded integration: {integration_id}")
            return integration

        except IntegrationError:
            raise
        except Exception as e:
            logger.error(f"Error loading integration '{integration_id}': {e}")
            raise IntegrationError(
                f"Failed to load integration '{integration_id}': {str(e)}"
            )

    async def unload_integration(self, integration_id: str) -> bool:
        """
        Unload an integration.

        Args:
            integration_id: ID of the integration to unload

        Returns:
            True if unload was successful

        Raises:
            IntegrationNotFoundError: If integration not loaded
        """
        if integration_id not in self._integrations:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' is not loaded"
            )

        try:
            integration = self._integrations[integration_id]
            success = await integration.async_teardown()

            if success:
                del self._integrations[integration_id]
                logger.info(f"Unloaded integration: {integration_id}")

            return success

        except Exception as e:
            logger.error(f"Error unloading integration '{integration_id}': {e}")
            raise IntegrationError(
                f"Failed to unload integration '{integration_id}': {str(e)}"
            )

    async def reload_integration(
        self,
        integration_id: str,
        config: Dict[str, Any] = None,
    ) -> BaseIntegration:
        """
        Reload an integration.

        Args:
            integration_id: ID of the integration to reload
            config: New configuration for the integration

        Returns:
            The reloaded integration instance
        """
        if integration_id in self._integrations:
            await self.unload_integration(integration_id)

        return await self.load_integration(integration_id, config)

    def get_integration(self, integration_id: str) -> Optional[BaseIntegration]:
        """Get a loaded integration by ID."""
        return self._integrations.get(integration_id)

    def get_all_integrations(self) -> Dict[str, BaseIntegration]:
        """Get all loaded integrations."""
        return self._integrations.copy()

    def get_manifest(self, integration_id: str) -> Optional[IntegrationManifest]:
        """Get a manifest by integration ID."""
        return self._manifests.get(integration_id)

    def get_all_manifests(self) -> Dict[str, IntegrationManifest]:
        """Get all registered manifests."""
        return self._manifests.copy()

    def get_registry(self) -> Dict[str, Type[BaseIntegration]]:
        """Get the integration registry."""
        return self._registry.copy()

    async def call_service(
        self,
        integration_id: str,
        service_name: str,
        **kwargs,
    ) -> Any:
        """
        Call a service from an integration.

        Args:
            integration_id: ID of the integration
            service_name: Name of the service
            **kwargs: Service parameters

        Returns:
            Service result

        Raises:
            IntegrationNotFoundError: If integration not loaded
        """
        integration = self.get_integration(integration_id)
        if not integration:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' is not loaded"
            )

        return await integration.call_service(service_name, **kwargs)

    async def emit_event(
        self,
        integration_id: str,
        event_name: str,
        data: Dict[str, Any] = None,
    ):
        """
        Emit an event from an integration.

        Args:
            integration_id: ID of the integration
            event_name: Name of the event
            data: Event data

        Raises:
            IntegrationNotFoundError: If integration not loaded
        """
        integration = self.get_integration(integration_id)
        if not integration:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' is not loaded"
            )

        await integration.emit_event(event_name, data)

    async def validate_integration_config(
        self,
        integration_id: str,
        config: Dict[str, Any],
    ) -> bool:
        """
        Validate integration configuration.

        Args:
            integration_id: ID of the integration
            config: Configuration to validate

        Returns:
            True if configuration is valid
        """
        if integration_id not in self._registry:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' not found"
            )

        # Try to instantiate with the config to validate
        try:
            integration_class = self._registry[integration_id]
            manifest = self._manifests[integration_id]
            temp_integration = integration_class(manifest, config)
            return await temp_integration.async_validate_config(config)
        except Exception as e:
            logger.error(f"Validation error for '{integration_id}': {e}")
            return False

    async def get_integration_status(self, integration_id: str) -> Dict[str, Any]:
        """
        Get the status of an integration.

        Args:
            integration_id: ID of the integration

        Returns:
            Status dictionary

        Raises:
            IntegrationNotFoundError: If integration not loaded
        """
        integration = self.get_integration(integration_id)
        if not integration:
            raise IntegrationNotFoundError(
                f"Integration '{integration_id}' is not loaded"
            )

        return await integration.get_status()
