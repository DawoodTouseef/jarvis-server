import time
from typing import Optional
from pydantic import Json
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    BigInteger,
)
from sqlalchemy.orm import relationship
from backend.internal.db import Base,JSONField


####################
# Home Assistant DB Schema
####################


class EventData(Base):
    __tablename__ = "event_data"

    data_id = Column(Integer, primary_key=True)
    hash = Column(BigInteger)
    shared_data = Column(Text)


class EventTypes(Base):
    __tablename__ = "event_types"

    event_type_id = Column(Integer, primary_key=True)
    event_type = Column(String(64))


class StateAttributes(Base):
    __tablename__ = "state_attributes"

    attributes_id = Column(Integer, primary_key=True)
    hash = Column(BigInteger)
    shared_attrs = Column(JSONField)


class StatesMeta(Base):
    __tablename__ = "states_meta"

    metadata_id = Column(Integer, primary_key=True)
    entity_id = Column(String(255))


class StatisticsMeta(Base):
    __tablename__ = "statistics_meta"

    id = Column(Integer, primary_key=True)
    statistic_id = Column(String(255))
    source = Column(String(32))
    unit_of_measurement = Column(String(255))
    has_mean = Column(Boolean)
    has_sum = Column(Boolean)
    name = Column(String(255))
    mean_type = Column(Integer, default=0)


class RecorderRuns(Base):
    __tablename__ = "recorder_runs"

    run_id = Column(Integer, primary_key=True)
    start = Column(DateTime, nullable=False)
    end = Column(DateTime)
    closed_incorrect = Column(Boolean, nullable=False)
    created = Column(DateTime, nullable=False)


class SchemaChanges(Base):
    __tablename__ = "schema_changes"

    change_id = Column(Integer, primary_key=True)
    schema_version = Column(Integer)
    changed = Column(DateTime, nullable=False)


class StatisticsRuns(Base):
    __tablename__ = "statistics_runs"

    run_id = Column(Integer, primary_key=True)
    start = Column(DateTime, nullable=False)


class Events(Base):
    __tablename__ = "events"


    event_id = Column(Integer, primary_key=True)
    event_type = Column(Text)
    event_data = Column(Text)
    origin = Column(Text)
    origin_idx = Column(SmallInteger)
    time_fired = Column(DateTime)
    time_fired_ts = Column(Float)
    context_id = Column(String(36))
    context_user_id = Column(String(36))
    context_parent_id = Column(String(36))
    data_id = Column(
        Integer, ForeignKey("event_data.data_id", ondelete="CASCADE"), nullable=True
    )
    context_id_bin = Column(Text)  # Using Text instead of BLOB for simplicity
    context_user_id_bin = Column(Text)
    context_parent_id_bin = Column(Text)
    event_type_id = Column(
        Integer, ForeignKey("event_types.event_type_id", ondelete="CASCADE"), nullable=True
    )

    # Relationships
    event_data_rel = relationship("EventData", foreign_keys=[data_id])
    event_type_rel = relationship("EventTypes", foreign_keys=[event_type_id])


class States(Base):
    __tablename__ = "states"

    state_id = Column(Integer, primary_key=True)
    entity_id = Column(Text)
    state = Column(String(255))
    attributes = Column(JSONField)
    event_id = Column(SmallInteger)
    last_changed = Column(DateTime)
    last_changed_ts = Column(Float)
    last_updated = Column(DateTime)
    last_updated_ts = Column(Float)
    old_state_id = Column(
        Integer, ForeignKey("states.state_id"), nullable=True
    )
    attributes_id = Column(
        Integer, ForeignKey("state_attributes.attributes_id"), nullable=True
    )
    context_id = Column(String(36))
    context_user_id = Column(String(36))
    context_parent_id = Column(String(36))
    origin_idx = Column(SmallInteger)
    context_id_bin = Column(Text)  # Using Text instead of BLOB for simplicity
    context_user_id_bin = Column(Text)
    context_parent_id_bin = Column(Text)
    metadata_id = Column(
        Integer, ForeignKey("states_meta.metadata_id"), nullable=True
    )
    last_reported_ts = Column(Float)

    # Relationships
    old_state = relationship("States", remote_side=[state_id])
    attributes_rel = relationship("StateAttributes", foreign_keys=[attributes_id])
    metadata_rel = relationship("StatesMeta", foreign_keys=[metadata_id])


class Statistics(Base):
    __tablename__ = "statistics"

    id = Column(Integer, primary_key=True)
    created = Column(DateTime)
    created_ts = Column(Float)
    metadata_id = Column(
        Integer, ForeignKey("statistics_meta.id", ondelete="CASCADE"), nullable=True
    )
    start = Column(DateTime)
    start_ts = Column(Float)
    mean = Column(Float)
    min = Column(Float)
    max = Column(Float)
    last_reset = Column(DateTime)
    last_reset_ts = Column(Float)
    state = Column(Float)
    sum = Column(Float)
    mean_weight = Column(Float)

    # Relationships
    metadata_rel = relationship("StatisticsMeta", foreign_keys=[metadata_id])


class StatisticsShortTerm(Base):
    __tablename__ = "statistics_short_term"

    id = Column(Integer, primary_key=True)
    created = Column(DateTime)
    created_ts = Column(Float)
    metadata_id = Column(
        Integer, ForeignKey("statistics_meta.id", ondelete="CASCADE"), nullable=True
    )
    start = Column(DateTime)
    start_ts = Column(Float)
    mean = Column(Float)
    min = Column(Float)
    max = Column(Float)
    last_reset = Column(DateTime)
    last_reset_ts = Column(Float)
    state = Column(Float)
    sum = Column(Float)
    mean_weight = Column(Float)

    # Relationships
    metadata_rel = relationship("StatisticsMeta", foreign_keys=[metadata_id])


class MigrationChanges(Base):
    __tablename__ = "migration_changes"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    floor_id = Column(Integer, nullable=True)
    icon = Column(String(255), nullable=True)
    label = Column(String(255), nullable=True)
    image = Column(Text, nullable=True)
    aliases = Column(Text, nullable=True)  # JSON string array


# New models for floors, areas, and sub-areas
class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    level = Column(Integer, default=0)
    icon = Column(String(255), nullable=True)
    aliases = Column(Text, nullable=True)  # JSON string array

    # Relationships
    areas = relationship("Area", back_populates="floor")


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="RESTRICT"), nullable=True)
    icon = Column(String(255), nullable=True)
    label = Column(String(255), nullable=True)
    image = Column(Text, nullable=True)
    aliases = Column(Text, nullable=True)  # JSON string array

    # Relationships
    floor = relationship("Floor", foreign_keys=[floor_id], back_populates="areas")
    sub_areas = relationship("SubArea", back_populates="area")


class SubArea(Base):
    __tablename__ = "sub_areas"
    __table_args__ = {"extend_existing": True}
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="RESTRICT"), nullable=False)
    icon = Column(String(255), nullable=True)

    # Relationships
    area = relationship("Area", foreign_keys=[area_id], back_populates="sub_areas")