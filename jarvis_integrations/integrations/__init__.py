"""
Jarvis Integration Framework - A modular, pluggable integration system.

This package provides a comprehensive framework for building integrations
inspired by Home Assistant Integrations, Home Assistant Add-ons, and VS Code Extensions.
"""

from .base import BaseIntegration, IntegrationConfig
from .schemas import (
    IntegrationManifest,
    IntegrationSchema,
    IntegrationStatus,
    IntegrationPermission,
)
from .manager import IntegrationManager
from .exceptions import (
    IntegrationError,
    IntegrationNotFoundError,
    IntegrationAlreadyExistsError,
    IntegrationValidationError,
)

__version__ = "0.1.0"
__author__ = "Jarvis Team"

__all__ = [
    "BaseIntegration",
    "IntegrationConfig",
    "IntegrationManifest",
    "IntegrationSchema",
    "IntegrationStatus",
    "IntegrationPermission",
    "IntegrationManager",
    "IntegrationError",
    "IntegrationNotFoundError",
    "IntegrationAlreadyExistsError",
    "IntegrationValidationError",
]
