"""
Exception classes for the Jarvis Integration Framework.
"""


class IntegrationError(Exception):
    """Base exception for all integration-related errors."""

    pass


class IntegrationNotFoundError(IntegrationError):
    """Raised when an integration is not found."""

    pass


class IntegrationAlreadyExistsError(IntegrationError):
    """Raised when trying to register an integration that already exists."""

    pass


class IntegrationValidationError(IntegrationError):
    """Raised when integration validation fails."""

    pass


class IntegrationConfigError(IntegrationError):
    """Raised when integration configuration is invalid."""

    pass


class IntegrationInstallError(IntegrationError):
    """Raised when integration installation fails."""

    pass


class IntegrationUninstallError(IntegrationError):
    """Raised when integration uninstallation fails."""

    pass
