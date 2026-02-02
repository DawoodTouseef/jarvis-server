"""
Schema definitions for integrations using Pydantic.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class IntegrationStatus(str, Enum):
    """Integration status enumeration."""

    INSTALLED = "installed"
    NOT_INSTALLED = "not_installed"
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"


class IntegrationPermission(str, Enum):
    """Integration permission enumeration."""

    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    DELETE = "delete"
    ADMIN = "admin"


class IntegrationRequirement(BaseModel):
    """Requirements for an integration."""

    name: str
    version: Optional[str] = None
    type: str = "python"  # python, javascript, system, etc.


class IntegrationAPIRoute(BaseModel):
    """API route definition for an integration."""

    path: str
    method: str = "GET"
    description: Optional[str] = None
    requires_auth: bool = True
    permissions: List[IntegrationPermission] = [IntegrationPermission.READ]


class IntegrationManifest(BaseModel):
    """Manifest for an integration, similar to Home Assistant."""

    id: str = Field(..., description="Unique integration ID")
    name: str = Field(..., description="Integration name")
    version: str = Field(..., description="Integration version")
    author: str = Field(..., description="Integration author")
    description: str = Field(..., description="Integration description")
    category: str = Field(default="other", description="Integration category")
    documentation_url: Optional[str] = None
    support_url: Optional[str] = None
    repository_url: Optional[str] = None
    issues_url: Optional[str] = None
    logo_url: Optional[str] = None
    icon: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    requirements: List[IntegrationRequirement] = Field(default_factory=list)
    api_routes: List[IntegrationAPIRoute] = Field(default_factory=list)
    config_schema: Optional[Dict[str, Any]] = None
    home_assistant_compatible: bool = False
    minimum_jarvis_version: str = "0.1.0"
    maximum_jarvis_version: Optional[str] = None


class IntegrationSchema(BaseModel):
    """Schema for storing integration data in database."""

    id: str
    manifest_id: str
    name: str
    description: str
    author: str
    version: str
    enabled: bool = True
    installed: bool = True
    status: IntegrationStatus = IntegrationStatus.INSTALLED
    category: str
    icon: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    integration_metadata: Dict[str, Any] = Field(default_factory=dict)
    installed_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_error: Optional[str] = None


class IntegrationCreateRequest(BaseModel):
    """Request model for creating an integration."""

    manifest: IntegrationManifest
    config: Dict[str, Any] = Field(default_factory=dict)


class IntegrationUpdateRequest(BaseModel):
    """Request model for updating an integration."""

    enabled: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class IntegrationResponse(BaseModel):
    """Response model for integration endpoints."""

    id: str
    manifest_id: str
    name: str
    description: str
    author: str
    version: str
    enabled: bool
    installed: bool
    status: IntegrationStatus
    category: str
    icon: Optional[str] = None
    config: Dict[str, Any]
    integration_metadata: Dict[str, Any]
    installed_at: datetime
    updated_at: datetime
    last_error: Optional[str] = None


class IntegrationListResponse(BaseModel):
    """Response model for listing integrations."""

    integrations: List[IntegrationResponse]
    total: int
    page: int
    page_size: int


class ServiceDefinition(BaseModel):
    """Definition for a service provided by an integration."""

    name: str
    description: str
    fields: Dict[str, Any] = Field(default_factory=dict)


class EventDefinition(BaseModel):
    """Definition for an event provided by an integration."""

    name: str
    description: str
    data_schema: Optional[Dict[str, Any]] = None


class BackgroundTaskDefinition(BaseModel):
    """Definition for a background task provided by an integration."""

    name: str
    description: str
    interval: Optional[int] = None  # in seconds
    enabled_by_default: bool = True
