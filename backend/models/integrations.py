"""
Database models for integrations using SQLAlchemy.
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Integration(Base):
    """Database model for storing integration data."""

    __tablename__ = "integrations"

    id = Column(String(255), primary_key=True, unique=True, nullable=False)
    manifest_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    author = Column(String(255))
    version = Column(String(50), nullable=False)
    enabled = Column(Boolean, default=True)
    installed = Column(Boolean, default=True)
    status = Column(String(50), default="installed")
    category = Column(String(100), default="other")
    icon = Column(String(255), nullable=True)
    config = Column(JSON, default={})
    integration_metadata = Column(JSON, default={})
    installed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_error = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Integration id={self.id} name={self.name} version={self.version}>"
