"""
API Router for integration management endpoints.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session

from backend.models.integrations import Integration
from jarvis_integrations import (
    IntegrationManager,
    IntegrationManifest,
)
from jarvis_integrations.schemas import (
    IntegrationResponse,
    IntegrationListResponse,
    IntegrationCreateRequest,
    IntegrationUpdateRequest
)
from jarvis_integrations.exceptions import (
    IntegrationError,
    IntegrationNotFoundError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

# Global integration manager instance
integration_manager: Optional[IntegrationManager] = None


def get_integration_manager() -> IntegrationManager:
    """Get the global integration manager instance."""
    if integration_manager is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Integration manager not initialized",
        )
    return integration_manager


def init_integration_manager(manager: IntegrationManager):
    """Initialize the global integration manager."""
    global integration_manager
    integration_manager = manager
    logger.info("Integration manager initialized.")


@router.get("/", response_model=IntegrationListResponse)
async def list_integrations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    enabled: Optional[bool] = None,
    category: Optional[str] = None,
):
    """
    List all integrations with pagination and filtering.

    Args:
        skip: Number of integrations to skip
        limit: Maximum number of integrations to return
        enabled: Filter by enabled status
        category: Filter by category

    Returns:
        List of integrations with pagination info
    """
    manager = get_integration_manager()

    try:
        all_manifests = manager.get_all_manifests()
        integrations_data = manager.get_all_integrations()
        
        # Filter based on criteria
        filtered_integrations = []
        for integration_id, manifest in all_manifests.items():
            integration = integrations_data.get(integration_id)

            if enabled is not None and integration and integration.enabled != enabled:
                continue

            if category and manifest.category != category:
                continue

            integration_response = IntegrationResponse(
                id=integration_id,
                manifest_id=manifest.id,
                name=manifest.name,
                description=manifest.description,
                author=manifest.author,
                version=manifest.version,
                enabled=integration.enabled if integration else False,
                installed=integration is not None,
                status="enabled" if (integration and integration.enabled) else "installed",
                category=manifest.category,
                icon=manifest.icon,
                config=integration.get_config() if integration else {},
                metadata=integration.manifest.__dict__ if integration else {},
                installed_at=integration.manifest.__dict__.get("installed_at") if integration else None,
                updated_at=integration.manifest.__dict__.get("updated_at") if integration else None,
            )
            filtered_integrations.append(integration_response)

        # Apply pagination
        total = len(filtered_integrations)
        integrations_page = filtered_integrations[skip : skip + limit]

        return IntegrationListResponse(
            integrations=integrations_page,
            total=total,
            page=skip // limit,
            page_size=limit,
        )

    except Exception as e:
        logger.error(f"Error listing integrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing integrations: {str(e)}",
        )


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(integration_id: str):
    """
    Get a specific integration by ID.

    Args:
        integration_id: The ID of the integration

    Returns:
        Integration details
    """
    manager = get_integration_manager()

    try:
        manifest = manager.get_manifest(integration_id)
        if not manifest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration '{integration_id}' not found",
            )

        integration = manager.get_integration(integration_id)

        return IntegrationResponse(
            id=integration_id,
            manifest_id=manifest.id,
            name=manifest.name,
            description=manifest.description,
            author=manifest.author,
            version=manifest.version,
            enabled=integration.enabled if integration else False,
            installed=integration is not None,
            status="enabled" if (integration and integration.enabled) else "installed",
            category=manifest.category,
            icon=manifest.icon,
            config=integration.get_config() if integration else {},
            metadata=manifest.__dict__ if manifest else {},
            installed_at=None,
            updated_at=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting integration: {str(e)}",
        )


@router.post("/{integration_id}/install")
async def install_integration(integration_id: str, config: Dict[str, Any] = None):
    """
    Install and enable an integration.

    Args:
        integration_id: The ID of the integration to install
        config: Configuration for the integration

    Returns:
        Installation result
    """
    manager = get_integration_manager()

    try:
        integration = await manager.load_integration(integration_id, config)
        return {
            "success": True,
            "message": f"Integration '{integration_id}' installed successfully",
            "integration_id": integration_id,
        }

    except IntegrationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found",
        )
    except IntegrationError as e:
        logger.error(f"Error installing integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to install integration: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Unexpected error installing integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during installation: {str(e)}",
        )


@router.post("/{integration_id}/uninstall")
async def uninstall_integration(integration_id: str):
    """
    Uninstall and disable an integration.

    Args:
        integration_id: The ID of the integration to uninstall

    Returns:
        Uninstallation result
    """
    manager = get_integration_manager()

    try:
        success = await manager.unload_integration(integration_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to uninstall integration '{integration_id}'",
            )

        return {
            "success": True,
            "message": f"Integration '{integration_id}' uninstalled successfully",
            "integration_id": integration_id,
        }

    except IntegrationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' is not installed",
        )
    except IntegrationError as e:
        logger.error(f"Error uninstalling integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to uninstall integration: {str(e)}",
        )


@router.post("/{integration_id}/enable")
async def enable_integration(integration_id: str):
    """
    Enable an installed integration.

    Args:
        integration_id: The ID of the integration to enable

    Returns:
        Enable result
    """
    manager = get_integration_manager()

    try:
        integration = manager.get_integration(integration_id)
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration '{integration_id}' is not installed",
            )

        integration.enabled = True

        return {
            "success": True,
            "message": f"Integration '{integration_id}' enabled successfully",
            "integration_id": integration_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enabling integration: {str(e)}",
        )


@router.post("/{integration_id}/disable")
async def disable_integration(integration_id: str):
    """
    Disable an installed integration.

    Args:
        integration_id: The ID of the integration to disable

    Returns:
        Disable result
    """
    manager = get_integration_manager()

    try:
        integration = manager.get_integration(integration_id)
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration '{integration_id}' is not installed",
            )

        integration.enabled = False

        return {
            "success": True,
            "message": f"Integration '{integration_id}' disabled successfully",
            "integration_id": integration_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error disabling integration: {str(e)}",
        )


@router.put("/{integration_id}")
async def update_integration(
    integration_id: str, request: IntegrationUpdateRequest
):
    """
    Update integration configuration and settings.

    Args:
        integration_id: The ID of the integration to update
        request: Update request with new config

    Returns:
        Update result
    """
    manager = get_integration_manager()

    try:
        integration = manager.get_integration(integration_id)
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration '{integration_id}' is not installed",
            )

        if request.enabled is not None:
            integration.enabled = request.enabled

        if request.config:
            # Validate config before updating
            if not await manager.validate_integration_config(integration_id, request.config):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid configuration provided",
                )
            integration.update_config(request.config)

        return {
            "success": True,
            "message": f"Integration '{integration_id}' updated successfully",
            "integration_id": integration_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating integration '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating integration: {str(e)}",
        )


@router.get("/{integration_id}/status")
async def get_integration_status(integration_id: str):
    """
    Get the current status of an integration.

    Args:
        integration_id: The ID of the integration

    Returns:
        Integration status
    """
    manager = get_integration_manager()

    try:
        status_data = await manager.get_integration_status(integration_id)
        return {
            "success": True,
            "integration_id": integration_id,
            "status": status_data,
        }

    except IntegrationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' is not installed",
        )
    except Exception as e:
        logger.error(f"Error getting integration status '{integration_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting integration status: {str(e)}",
        )


@router.get("/categories")
async def get_integration_categories():
    """
    Get all available integration categories.

    Returns:
        List of categories
    """
    manager = get_integration_manager()

    try:
        manifests = manager.get_all_manifests()
        categories = set()

        for manifest in manifests.values():
            categories.add(manifest.category)

        return {
            "success": True,
            "categories": sorted(list(categories)),
        }

    except Exception as e:
        logger.error(f"Error getting integration categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting categories: {str(e)}",
        )