from pydantic import BaseModel
from typing import Optional, Any, Dict, List, Union
from datetime import datetime


class EventDataCreate(BaseModel):
    event_type: str
    event_data: Optional[Dict[str, Any]]
    origin: Optional[str] = "LOCAL"


class EventDataUpdate(BaseModel):
    event_type: Optional[str] = None
    event_data: Optional[Dict[str, Any]] = None
    origin: Optional[str] = None


class EventOut(BaseModel):
    event_id: int
    event_type: str
    event_data: Optional[Dict[str, Any]]
    time_fired: Optional[datetime]
    time_fired_ts: Optional[float]

    class Config:
        orm_mode = True


class StateCreate(BaseModel):
    state: str
    attributes: Optional[Dict[str, Any]]


class StateUpdate(BaseModel):
    state: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class StateOut(BaseModel):
    state_id: int
    entity_id: str
    state: str
    attributes: Optional[Dict[str, Any]]
    last_changed: Optional[datetime]
    last_updated: Optional[datetime]
    context: Optional[Dict[str, Any]]

    class Config:
        orm_mode = True


class StateAttributesCreate(BaseModel):
    hash: Optional[int]
    shared_attrs: str


class StateAttributesOut(BaseModel):
    attributes_id: int
    hash: Optional[int]
    shared_attrs: str

    class Config:
        orm_mode = True


class StatesMetaCreate(BaseModel):
    entity_id: str


class StatesMetaOut(BaseModel):
    metadata_id: int
    entity_id: str

    class Config:
        orm_mode = True


class StatisticsMetaCreate(BaseModel):
    statistic_id: str
    source: str
    unit_of_measurement: Optional[str]
    has_mean: bool
    has_sum: bool
    name: Optional[str]
    mean_type: Optional[int] = 0


class StatisticsMetaOut(BaseModel):
    id: int
    statistic_id: str
    source: str
    unit_of_measurement: Optional[str]
    has_mean: bool
    has_sum: bool
    name: Optional[str]
    mean_type: Optional[int]

    class Config:
        orm_mode = True


class StatisticsCreate(BaseModel):
    created: Optional[datetime]
    created_ts: Optional[float]
    metadata_id: Optional[int]
    start: Optional[datetime]
    start_ts: Optional[float]
    mean: Optional[float]
    min: Optional[float]
    max: Optional[float]
    last_reset: Optional[datetime]
    last_reset_ts: Optional[float]
    state: Optional[float]
    sum: Optional[float]
    mean_weight: Optional[float]


class StatisticsOut(BaseModel):
    id: int
    created: Optional[datetime]
    created_ts: Optional[float]
    metadata_id: Optional[int]
    start: Optional[datetime]
    start_ts: Optional[float]
    mean: Optional[float]
    min: Optional[float]
    max: Optional[float]
    last_reset: Optional[datetime]
    last_reset_ts: Optional[float]
    state: Optional[float]
    sum: Optional[float]
    mean_weight: Optional[float]

    class Config:
        orm_mode = True


class StatisticsShortTermCreate(BaseModel):
    created: Optional[datetime]
    created_ts: Optional[float]
    metadata_id: Optional[int]
    start: Optional[datetime]
    start_ts: Optional[float]
    mean: Optional[float]
    min: Optional[float]
    max: Optional[float]
    last_reset: Optional[datetime]
    last_reset_ts: Optional[float]
    state: Optional[float]
    sum: Optional[float]
    mean_weight: Optional[float]


class StatisticsShortTermOut(BaseModel):
    id: int
    created: Optional[datetime]
    created_ts: Optional[float]
    metadata_id: Optional[int]
    start: Optional[datetime]
    start_ts: Optional[float]
    mean: Optional[float]
    min: Optional[float]
    max: Optional[float]
    last_reset: Optional[datetime]
    last_reset_ts: Optional[float]
    state: Optional[float]
    sum: Optional[float]
    mean_weight: Optional[float]

    class Config:
        orm_mode = True


class RecorderRunsCreate(BaseModel):
    start: datetime
    end: Optional[datetime]
    closed_incorrect: bool
    created: datetime


class RecorderRunsOut(BaseModel):
    run_id: int
    start: datetime
    end: Optional[datetime]
    closed_incorrect: bool
    created: datetime

    class Config:
        orm_mode = True


class SchemaChangesCreate(BaseModel):
    schema_version: int
    changed: datetime


class SchemaChangesOut(BaseModel):
    change_id: int
    schema_version: int
    changed: datetime

    class Config:
        orm_mode = True


class MigrationChangesCreate(BaseModel):
    migration_id: str
    version: int


class MigrationChangesOut(BaseModel):
    migration_id: str
    version: int

    class Config:
        orm_mode = True


class ConfigOut(BaseModel):
    components: List[str]
    config_dir: str
    location: Optional[Dict[str, float]]
    time_zone: str
    version: str


class EventTypesCreate(BaseModel):
    event_type: str


class EventTypesOut(BaseModel):
    event_type_id: int
    event_type: str

    class Config:
        orm_mode = True


class ServiceOut(BaseModel):
    domain: str
    services: List[str]


class HistoryOut(BaseModel):
    entity_id: str
    states: List[StateOut]


class OverviewOut(BaseModel):
    events_count: int
    entities_count: int
    statistics_meta_count: int
    current_schema_version: int


# New schemas for floors, areas, and sub-areas
class FloorCreate(BaseModel):
    name: str
    level: Optional[int] = 0
    icon: Optional[str] = None
    aliases: Optional[List[str]] = []


class FloorUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    icon: Optional[str] = None
    aliases: Optional[List[str]] = None


class FloorOut(BaseModel):
    id: int
    name: str
    level: Optional[int]
    icon: Optional[str]
    aliases: Optional[List[str]]

    class Config:
        orm_mode = True


class AreaCreate(BaseModel):
    name: str
    floor_id: Optional[int] = None
    icon: Optional[str] = None
    label: Optional[str] = None
    image: Optional[str] = None
    aliases: Optional[List[str]] = []


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    floor_id: Optional[int] = None
    icon: Optional[str] = None
    label: Optional[str] = None
    image: Optional[str] = None
    aliases: Optional[List[str]] = None


class AreaOut(BaseModel):
    id: int
    name: str
    floor_id: Optional[int]
    icon: Optional[str]
    label: Optional[str]
    image: Optional[str]
    aliases: Optional[List[str]]

    class Config:
        orm_mode = True


class SubAreaCreate(BaseModel):
    name: str
    area_id: int
    icon: Optional[str] = None


class SubAreaUpdate(BaseModel):
    name: Optional[str] = None
    area_id: Optional[int] = None
    icon: Optional[str] = None


class SubAreaOut(BaseModel):
    id: int
    name: str
    area_id: int
    icon: Optional[str]

    class Config:
        orm_mode = True
