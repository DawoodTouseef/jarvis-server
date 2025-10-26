import logging
import time
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime

from backend.internal.db import get_db
from backend.models.homeassistant import (
    Events, EventData, EventTypes, States, StateAttributes, 
    StatesMeta, StatisticsMeta, Statistics, StatisticsShortTerm,
    RecorderRuns, SchemaChanges, MigrationChanges
)
from backend.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])


class HomeAssistantController:
    """
    Controller class for Home Assistant database operations.
    Provides CRUD operations for all Home Assistant entities.
    """

    # Events operations
    def create_event(
        self, 
        event_type: str, 
        event_data: Optional[Dict[str, Any]] = None,
        origin: Optional[str] = "LOCAL",
        time_fired: Optional[datetime] = None,
        context_id: Optional[str] = None,
        context_user_id: Optional[str] = None,
        context_parent_id: Optional[str] = None
    ) -> Optional[Events]:
        """Create a new event in the database."""
        try:
            with get_db() as db:
                # Create event data if provided
                data_id = None
                if event_data:
                    event_data_obj = EventData(
                        hash=hash(str(event_data)),
                        shared_data=str(event_data)
                    )
                    db.add(event_data_obj)
                    db.flush()
                    data_id = event_data_obj.data_id

                # Create the event
                event = Events(
                    event_type=event_type,
                    event_data=str(event_data) if event_data else None,
                    origin=origin,
                    origin_idx=1 if origin == "LOCAL" else 2,
                    time_fired=time_fired or datetime.now(),
                    time_fired_ts=time_fired.timestamp() if time_fired else time.time(),
                    context_id=context_id or str(uuid.uuid4()),
                    context_user_id=context_user_id,
                    context_parent_id=context_parent_id,
                    data_id=data_id
                )
                
                db.add(event)
                db.commit()
                db.refresh(event)
                return event
        except Exception as e:
            log.error(f"Error creating event: {e}")
            return None

    def get_event_by_id(self, event_id: int) -> Optional[Events]:
        """Get an event by its ID."""
        try:
            with get_db() as db:
                return db.query(Events).filter(Events.event_id == event_id).first()
        except Exception as e:
            log.error(f"Error getting event by ID {event_id}: {e}")
            return None

    def get_events(
        self, 
        event_type: Optional[str] = None, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[Events]:
        """Get events with optional filtering."""
        try:
            with get_db() as db:
                query = db.query(Events)
                
                if event_type:
                    query = query.filter(Events.event_type == event_type)
                    
                return query.order_by(Events.time_fired_ts.desc()).offset(offset).limit(limit).all()
        except Exception as e:
            log.error(f"Error getting events: {e}")
            return []

    def delete_event(self, event_id: int) -> bool:
        """Delete an event by its ID."""
        try:
            with get_db() as db:
                event = db.query(Events).filter(Events.event_id == event_id).first()
                if event:
                    db.delete(event)
                    db.commit()
                    return True
                return False
        except Exception as e:
            log.error(f"Error deleting event {event_id}: {e}")
            return False

    # States operations
    def create_state(
        self,
        entity_id: str,
        state: str,
        attributes: Optional[Dict[str, Any]] = None,
        last_changed: Optional[datetime] = None,
        last_updated: Optional[datetime] = None,
        context_id: Optional[str] = None,
        context_user_id: Optional[str] = None,
        context_parent_id: Optional[str] = None
    ) -> Optional[States]:
        """Create a new state in the database."""
        try:
            with get_db() as db:
                # Ensure entity metadata exists
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    meta = StatesMeta(entity_id=entity_id)
                    db.add(meta)
                    db.flush()

                # Create state attributes if provided
                attributes_id = None
                if attributes:
                    attrs_obj = StateAttributes(
                        hash=hash(str(attributes)),
                        shared_attrs=str(attributes)
                    )
                    db.add(attrs_obj)
                    db.flush()
                    attributes_id = attrs_obj.attributes_id

                # Create the state
                state_obj = States(
                    entity_id=entity_id,
                    state=state,
                    attributes=str(attributes) if attributes else None,
                    last_changed=last_changed or datetime.now(),
                    last_changed_ts=last_changed.timestamp() if last_changed else time.time(),
                    last_updated=last_updated or datetime.now(),
                    last_updated_ts=last_updated.timestamp() if last_updated else time.time(),
                    context_id=context_id or str(uuid.uuid4()),
                    context_user_id=context_user_id,
                    context_parent_id=context_parent_id,
                    metadata_id=meta.metadata_id,
                    attributes_id=attributes_id
                )
                
                db.add(state_obj)
                db.commit()
                db.refresh(state_obj)
                return state_obj
        except Exception as e:
            log.error(f"Error creating state: {e}")
            return None

    def get_state_by_id(self, state_id: int) -> Optional[States]:
        """Get a state by its ID."""
        try:
            with get_db() as db:
                return db.query(States).filter(States.state_id == state_id).first()
        except Exception as e:
            log.error(f"Error getting state by ID {state_id}: {e}")
            return None

    def get_states_by_entity_id(self, entity_id: str) -> List[States]:
        """Get all states for a specific entity."""
        try:
            with get_db() as db:
                # Find the metadata for this entity
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    return []
                    
                return db.query(States).filter(States.metadata_id == meta.metadata_id).all()
        except Exception as e:
            log.error(f"Error getting states for entity {entity_id}: {e}")
            return []

    def get_latest_state_by_entity_id(self, entity_id: str) -> Optional[States]:
        """Get the latest state for a specific entity."""
        try:
            with get_db() as db:
                # Find the metadata for this entity
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    return None
                    
                return db.query(States).filter(States.metadata_id == meta.metadata_id).order_by(States.last_updated_ts.desc()).first()
        except Exception as e:
            log.error(f"Error getting latest state for entity {entity_id}: {e}")
            return None

    def update_state(
        self,
        state_id: int,
        state: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
        last_updated: Optional[datetime] = None
    ) -> Optional[States]:
        """Update an existing state."""
        try:
            with get_db() as db:
                state_obj = db.query(States).filter(States.state_id == state_id).first()
                if not state_obj:
                    return None

                # Update fields if provided
                update_data = {}
                if state is not None:
                    update_data["state"] = state
                    
                if attributes is not None:
                    update_data["attributes"] = str(attributes)
                    
                if last_updated is not None:
                    update_data["last_updated"] = last_updated
                    update_data["last_updated_ts"] = last_updated.timestamp()

                if update_data:
                    db.query(States).filter(States.state_id == state_id).update(update_data)
                    db.commit()
                    return db.query(States).filter(States.state_id == state_id).first()
                return state_obj
        except Exception as e:
            log.error(f"Error updating state {state_id}: {e}")
            return None

    def delete_state(self, state_id: int) -> bool:
        """Delete a state by its ID."""
        try:
            with get_db() as db:
                state = db.query(States).filter(States.state_id == state_id).first()
                if state:
                    db.delete(state)
                    db.commit()
                    return True
                return False
        except Exception as e:
            log.error(f"Error deleting state {state_id}: {e}")
            return False

    def delete_states_by_entity_id(self, entity_id: str) -> bool:
        """Delete all states for a specific entity."""
        try:
            with get_db() as db:
                # Find the metadata for this entity
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    return False
                    
                db.query(States).filter(States.metadata_id == meta.metadata_id).delete()
                db.commit()
                return True
        except Exception as e:
            log.error(f"Error deleting states for entity {entity_id}: {e}")
            return False

    # Statistics operations
    def create_statistic(
        self,
        statistic_id: str,
        start: datetime,
        mean: Optional[float] = None,
        min_val: Optional[float] = None,
        max_val: Optional[float] = None,
        state: Optional[float] = None,
        sum_val: Optional[float] = None
    ) -> Optional[Statistics]:
        """Create a new long-term statistic."""
        try:
            with get_db() as db:
                # Ensure statistics metadata exists
                meta = db.query(StatisticsMeta).filter(StatisticsMeta.statistic_id == statistic_id).first()
                if not meta:
                    meta = StatisticsMeta(
                        statistic_id=statistic_id,
                        source="recorder"
                    )
                    db.add(meta)
                    db.flush()

                # Create the statistic
                statistic = Statistics(
                    created=datetime.now(),
                    created_ts=time.time(),
                    metadata_id=meta.id,
                    start=start,
                    start_ts=start.timestamp(),
                    mean=mean,
                    min=min_val,
                    max=max_val,
                    state=state,
                    sum=sum_val
                )
                
                db.add(statistic)
                db.commit()
                db.refresh(statistic)
                return statistic
        except Exception as e:
            log.error(f"Error creating statistic: {e}")
            return None

    def get_statistics_by_statistic_id(self, statistic_id: str) -> List[Statistics]:
        """Get all statistics for a specific statistic ID."""
        try:
            with get_db() as db:
                # Find the metadata for this statistic
                meta = db.query(StatisticsMeta).filter(StatisticsMeta.statistic_id == statistic_id).first()
                if not meta:
                    return []
                    
                return db.query(Statistics).filter(Statistics.metadata_id == meta.id).all()
        except Exception as e:
            log.error(f"Error getting statistics for {statistic_id}: {e}")
            return []

    # Entity metadata operations
    def get_or_create_entity_metadata(self, entity_id: str) -> Optional[StatesMeta]:
        """Get or create entity metadata."""
        try:
            with get_db() as db:
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    meta = StatesMeta(entity_id=entity_id)
                    db.add(meta)
                    db.commit()
                    db.refresh(meta)
                return meta
        except Exception as e:
            log.error(f"Error getting/creating entity metadata for {entity_id}: {e}")
            return None

    def get_all_entity_ids(self) -> List[str]:
        """Get all entity IDs."""
        try:
            with get_db() as db:
                metas = db.query(StatesMeta).all()
                return [str(meta.entity_id) for meta in metas]
        except Exception as e:
            log.error(f"Error getting all entity IDs: {e}")
            return []


# Create the singleton instance
HomeAssistant = HomeAssistantController()