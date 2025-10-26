import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, text

from backend.internal.db import get_db
from backend.utils.auth import get_current_user, get_verified_user
from backend.models.homeassistant import (
    Events, EventData, EventTypes, States, StateAttributes, 
    StatesMeta, StatisticsMeta, Statistics, StatisticsShortTerm,
    RecorderRuns, SchemaChanges, MigrationChanges
)
from backend.models.home_assistant_schemas import (
    EventDataCreate, EventOut, StateCreate, StateOut, 
    StateAttributesCreate, StatesMetaCreate, StatisticsMetaCreate,
    StatisticsCreate, StatisticsShortTermCreate, RecorderRunsCreate,
    SchemaChangesCreate, MigrationChangesCreate, ConfigOut,
    EventTypesCreate, EventTypesOut, ServiceOut, HistoryOut, OverviewOut,
    StatisticsMetaOut, StatisticsOut, StatisticsShortTermOut,
    RecorderRunsOut, SchemaChangesOut, MigrationChangesOut
)
from backend.models.home_assistant_controllers import (
    EventsCtrl, StatesCtrl, StatisticsCtrl, StatesMetaCtrl,
    EventDataCtrl, EventTypesCtrl, StateAttributesCtrl,
    StatisticsMetaCtrl, RecorderRunsCtrl, SchemaChangesCtrl,
    MigrationChangesCtrl, StatisticsShortTermCtrl, StatisticsRunsCtrl
)
import ast
router = APIRouter()

# Logger
log = logging.getLogger(__name__)

# Helper function to serialize datetime objects
def serialize_datetime(dt: datetime) -> str:
    """Serialize datetime to ISO format string"""
    if dt:
        return dt.isoformat()
    return None

############################
# System / Info Endpoints
############################

@router.get("/", summary="API Root")
async def get_api_root():
    """Returns a simple message indicating the API is running."""
    return {"message": "API running."}

@router.get("/health", summary="Health Check")
async def health_check():
    """Simple database health check."""
    try:
        from backend.internal.db import Session
        Session.execute(text("SELECT 1;")).all()
        return {"status": "ok"}
    except Exception as e:
        log.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )

@router.get("/config", response_model=ConfigOut, summary="Get Configuration")
async def get_config(user=Depends(get_verified_user)):
    """Return application configuration summary."""
    return ConfigOut(
        components=["api", "frontend", "history", "recorder", "websocket_api"],
        config_dir="/config",
        location={"latitude": 0.0, "longitude": 0.0},
        time_zone="UTC",
        version="2023.1.0"
    )

@router.get("/components", response_model=List[str], summary="Get Components")
async def get_components(user=Depends(get_verified_user)):
    """Return list of loaded components."""
    return ["api", "frontend", "history", "recorder", "websocket_api", "http"]

@router.get("/overview", response_model=OverviewOut, summary="Get Overview")
async def get_overview(user=Depends(get_verified_user)):
    """Return counts of various entities in the system."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            events_count = db.query(Events).count()
            entities_count = db.query(StatesMeta).count()
            statistics_meta_count = db.query(StatisticsMeta).count()
            
            # Get the latest schema version
            latest_schema = db.query(SchemaChanges).order_by(
                SchemaChanges.change_id.desc()
            ).first()
            current_schema_version = latest_schema.schema_version if latest_schema else 0
            
            return OverviewOut(
                events_count=int(events_count) if hasattr(events_count, '__int__') else events_count,
                entities_count=int(entities_count) if hasattr(entities_count, '__int__') else entities_count,
                statistics_meta_count=int(statistics_meta_count) if hasattr(statistics_meta_count, '__int__') else statistics_meta_count,
                current_schema_version=int(current_schema_version) if isinstance(current_schema_version, (int, float)) else 0
            )
    except Exception as e:
        log.error(f"Error getting overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get overview"
        )

############################
# Events Endpoints
############################

@router.get("/events", response_model=List[Dict[str, Any]], summary="Get All Events")
async def get_events(user=Depends(get_verified_user)):
    """Return array of event objects with event types and listener counts."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            # Get distinct event types from the events table
            event_types = db.query(Events.event_type).distinct().all()
            result = []
            for (event_type,) in event_types:
                # Count events of this type as a proxy for listener count
                listener_count = db.query(Events).filter(
                    Events.event_type == event_type
                ).count()
                result.append({
                    "event": event_type,
                    "listener_count": listener_count
                })
            return result
    except Exception as e:
        log.error(f"Error getting events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get events"
        )

@router.get("/events/{event_id}", response_model=EventOut, summary="Get Event by ID")
async def get_event_by_id(
    event_id: int, 
    user=Depends(get_verified_user)
):
    """Return single event by ID."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            event = db.query(Events).filter(Events.event_id == event_id).first()
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            return event
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error getting event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get event"
        )

@router.get("/events/recent", response_model=List[EventOut], summary="Get Recent Events")
async def get_recent_events(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None),
    user=Depends(get_verified_user)
):
    """Get recent events with optional filtering and pagination."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            query = db.query(Events)
            
            if event_type:
                query = query.filter(Events.event_type == event_type)
                
            events = query.order_by(Events.time_fired_ts.desc()).offset(offset).limit(limit).all()
            return events
    except Exception as e:
        log.error(f"Error getting recent events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent events"
        )

@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED, summary="Create Event")
async def create_event(
    event_data: EventDataCreate,
    user=Depends(get_verified_user)
):
    """Create a new event."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            # Create event data if provided
            data_id = None
            if event_data.event_data:
                event_data_record = EventData(
                    shared_data=json.dumps(event_data.event_data)
                )
                db.add(event_data_record)
                db.flush()
                data_id = event_data_record.data_id

            # Create the event
            event = Events(
                event_type=event_data.event_type,
                event_data=json.dumps(event_data.event_data) if event_data.event_data else None,
                origin=event_data.origin,
                time_fired=datetime.utcnow(),
                time_fired_ts=datetime.utcnow().timestamp(),
                data_id=data_id
            )
            
            db.add(event)
            db.commit()
            db.refresh(event)
            
            # Convert the event_data back to a dictionary for the response
            if event.event_data:
                try:
                    event_dict = event.__dict__.copy()
                    event_dict['event_data'] = json.loads(event.event_data)
                    return EventOut(**event_dict)
                except:
                    # If we can't parse the JSON, return the event as is
                    return event
            else:
                return event
    except Exception as e:
        log.error(f"Error creating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event"
        )

@router.delete("/events/{event_id}", response_model=bool, summary="Delete Event")
async def delete_event(
    event_id: int,
    user=Depends(get_verified_user)
):
    """Delete an event by ID."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            event = db.query(Events).filter(Events.event_id == event_id).first()
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
                
            db.delete(event)
            db.commit()
            return True
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error deleting event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event"
        )

############################
# States Endpoints
############################

@router.get("/states", response_model=List[StateOut], summary="Get All States")
async def get_states(
    entity_id: Optional[str] = Query(None),
    user=Depends(get_verified_user)
) -> list[Any]:
    """Return list of current entity states."""
    try:
        with get_db() as db:
            query = db.query(States)

            if entity_id:
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if meta and meta.metadata_id:
                    query = query.filter(States.metadata_id == meta.metadata_id)
                else:
                    query = query.filter(States.entity_id == entity_id)

            states = query.order_by(States.last_updated_ts.desc()).limit(100).all()
            result = []

            for state in states:
                attributes = {}
                if getattr(state, 'attributes_id', None):
                    attrs = db.query(StateAttributes).filter_by(
                        attributes_id=state.attributes_id
                    ).first()

                    if attrs and attrs.shared_attrs:
                        try:
                            attributes = ast.literal_eval(attrs.shared_attrs)
                        except (json.JSONDecodeError, ValueError, TypeError):
                            attributes = {}
                else:
                    try:
                        attributes = ast.literal_eval(state.attributes or "{}")
                    except json.JSONDecodeError:
                        attributes = {}

                context = {
                    "id": getattr(state, "context_id", ""),
                    "parent_id": getattr(state, "context_parent_id", ""),
                    "user_id": getattr(state, "context_user_id", "")
                }
                result.append(StateOut(
                    state_id=state.state_id,
                    entity_id=state.entity_id,
                    state=state.state,
                    attributes=attributes,
                    last_changed=state.last_changed,
                    last_updated=state.last_updated,
                    context=context
                ))

            return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get states: {e}"
        )

@router.get("/states/{entity_id}", response_model=StateOut, summary="Get State by Entity ID")
async def get_state_by_entity_id(
    entity_id: str,
    user=Depends(get_verified_user)
):
    """Return the latest state for an entity."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            # Find the metadata for this entity
            meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
            if not meta:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Entity not found"
                )
                
            # Get the latest state for this entity
            state = db.query(States).filter(
                States.metadata_id == meta.metadata_id
            ).order_by(States.last_updated_ts.desc()).first()
            
            if not state:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="State not found"
                )
                
            # Parse attributes
            attributes = {}
            state_attributes_id = int(str(getattr(state, 'attributes_id', 0)))
            if state_attributes_id and state_attributes_id > 0:
                attrs_record = db.query(StateAttributes).filter(
                    StateAttributes.attributes_id == state_attributes_id
                ).first()
                attrs_shared_attrs = str(getattr(attrs_record, 'shared_attrs', "")) if attrs_record else ""
                if attrs_record and attrs_shared_attrs:
                    try:
                        attributes = json.loads(attrs_shared_attrs)
                    except:
                        attributes = {}
            else:
                state_attrs = str(getattr(state, 'attributes', ""))
                if state_attrs:
                    try:
                        attributes = json.loads(state_attrs)
                    except:
                        attributes = {}
            
            # Create context object
            context = {
                "id": str(getattr(state, 'context_id', "")),
                "parent_id": str(getattr(state, 'context_parent_id', "")),
                "user_id": str(getattr(state, 'context_user_id', ""))
            }
            
            return StateOut(
                state_id=int(str(getattr(state, 'state_id', 0))),
                entity_id=entity_id,
                state=str(getattr(state, 'state', "")),
                attributes=attributes,
                last_changed=getattr(state, 'last_changed', None),
                last_updated=getattr(state, 'last_updated', None),
                context=context
            )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error getting state for {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get state"
        )

@router.post("/states/{entity_id}", response_model=StateOut, status_code=status.HTTP_201_CREATED, summary="Create/Update State")
async def create_or_update_state(
    entity_id: str,
    state_data: StateCreate,
    user=Depends(get_verified_user)
):
    """Create or update state for an entity."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            # Check if entity metadata exists, create if not
            meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
            if not meta:
                meta = StatesMeta(entity_id=entity_id)
                db.add(meta)
                db.flush()
            
            # Create state attributes if provided
            attributes_id = None
            if state_data.attributes:
                attrs_record = StateAttributes(
                    shared_attrs=json.dumps(state_data.attributes)
                )
                db.add(attrs_record)
                db.flush()
                attributes_id = attrs_record.attributes_id
            
            # Create the state
            now = datetime.utcnow()
            now_ts = now.timestamp()
            
            state = States(
                entity_id=entity_id,
                state=state_data.state,
                attributes=json.dumps(state_data.attributes) if state_data.attributes else None,
                attributes_id=attributes_id,
                last_changed=now,
                last_updated=now,
                last_changed_ts=now_ts,
                last_updated_ts=now_ts,
                metadata_id=meta.metadata_id,
                context_id=str(now_ts),  # Simple context ID
            )
            
            db.add(state)
            db.commit()
            db.refresh(state)
            
            # Parse attributes for response
            attributes = {}
            state_attributes_id = int(str(getattr(state, 'attributes_id', 0)))
            if state_attributes_id and state_attributes_id > 0:
                attrs_record = db.query(StateAttributes).filter(
                    StateAttributes.attributes_id == state_attributes_id
                ).first()
                attrs_shared_attrs = str(getattr(attrs_record, 'shared_attrs', "")) if attrs_record else ""
                if attrs_record and attrs_shared_attrs:
                    try:
                        attributes = json.loads(attrs_shared_attrs)
                    except:
                        attributes = {}
            else:
                state_attrs = str(getattr(state, 'attributes', ""))
                if state_attrs:
                    try:
                        attributes = json.loads(state_attrs)
                    except:
                        attributes = {}
            
            # Create context object
            context = {
                "id": str(getattr(state, 'context_id', "")),
                "parent_id": str(getattr(state, 'context_parent_id', "")),
                "user_id": str(getattr(state, 'context_user_id', ""))
            }
            
            return StateOut(
                state_id=int(str(getattr(state, 'state_id', 0))),
                entity_id=entity_id,
                state=str(getattr(state, 'state', "")),
                attributes=attributes,
                last_changed=getattr(state, 'last_changed', None),
                last_updated=getattr(state, 'last_updated', None),
                context=context
            )
    except Exception as e:
        log.error(f"Error creating/updating state for {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create/update state"
        )

@router.delete("/states/{entity_id}", response_model=bool, summary="Delete State")
async def delete_state(
    entity_id: str,
    user=Depends(get_verified_user)
):
    """Delete all states for an entity."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            # Find the metadata for this entity
            meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
            if not meta:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Entity not found"
                )
                
            # Delete all states for this entity
            db.query(States).filter(States.metadata_id == meta.metadata_id).delete()
            db.commit()
            return True
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error deleting states for {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete states"
        )

############################
# History Endpoints
############################

@router.get("/history/period", response_model=List[List[StateOut]], summary="Get State History")
async def get_state_history(
    filter_entity_id: str = Query(...),
    end_time: Optional[str] = Query(None),
    minimal_response: bool = Query(False),
    no_attributes: bool = Query(False),
    significant_changes_only: bool = Query(False),
    user=Depends(get_verified_user)
):
    """
    Return state history for entities.
    
    filter_entity_id: Comma-separated list of entity IDs
    end_time: End time in ISO format
    minimal_response: Only include last_changed and state for intermediate states
    no_attributes: Skip returning attributes
    significant_changes_only: Only return significant state changes
    """
    try:
        entity_ids = [eid.strip() for eid in filter_entity_id.split(',')]
        result = []
        
        # Calculate start time (default to 1 day ago)
        end_dt = datetime.fromisoformat(end_time) if end_time else datetime.utcnow()
        start_dt = end_dt - timedelta(days=1)
        start_ts = start_dt.timestamp()
        end_ts = end_dt.timestamp()
        
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            for entity_id in entity_ids:
                # Find the metadata for this entity
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    continue
                    
                # Query states for this entity within the time range
                query = db.query(States).filter(
                    and_(
                        States.metadata_id == meta.metadata_id,
                        States.last_updated_ts >= start_ts,
                        States.last_updated_ts <= end_ts
                    )
                ).order_by(States.last_updated_ts)
                
                states = query.all()
                
                # Process states
                entity_states = []
                last_state = None
                for state in states:
                    # Skip insignificant changes if requested
                    state_value = str(getattr(state, 'state', ""))
                    last_state_value = str(getattr(last_state, 'state', "")) if last_state else ""
                    if significant_changes_only and last_state and state_value == last_state_value:
                        continue
                        
                    # Parse attributes
                    attributes = {}
                    if not no_attributes:
                        state_attributes_id = int(str(getattr(state, 'attributes_id', 0)))
                        if state_attributes_id and state_attributes_id > 0:
                            attrs_record = db.query(StateAttributes).filter(
                                StateAttributes.attributes_id == state_attributes_id
                            ).first()
                            attrs_shared_attrs = str(getattr(attrs_record, 'shared_attrs', "")) if attrs_record else ""
                            if attrs_record and attrs_shared_attrs:
                                try:
                                    attributes = json.loads(attrs_shared_attrs)
                                except:
                                    attributes = {}
                        else:
                            state_attrs = str(getattr(state, 'attributes', ""))
                            if state_attrs:
                                try:
                                    attributes = json.loads(state_attrs)
                                except:
                                    attributes = {}
                    
                    # Create context object
                    context = {
                        "id": str(getattr(state, 'context_id', "")),
                        "parent_id": str(getattr(state, 'context_parent_id', "")),
                        "user_id": str(getattr(state, 'context_user_id', ""))
                    }
                    
                    # Create state output
                    if minimal_response and last_state and entity_states:
                        # For minimal response, only include last_changed and state for intermediate states
                        state_out = StateOut(
                            state_id=int(str(getattr(state, 'state_id', 0))),
                            entity_id=entity_id,
                            state=state_value,
                            attributes=attributes if not entity_states else {},  # Only attributes for first and last
                            last_changed=getattr(state, 'last_changed', None),
                            last_updated=getattr(state, 'last_updated', None),
                            context=context if not entity_states else {}  # Only context for first and last
                        )
                    else:
                        state_out = StateOut(
                            state_id=int(str(getattr(state, 'state_id', 0))),
                            entity_id=entity_id,
                            state=state_value,
                            attributes=attributes,
                            last_changed=getattr(state, 'last_changed', None),
                            last_updated=getattr(state, 'last_updated', None),
                            context=context
                        )
                    
                    entity_states.append(state_out)
                    last_state = state
                
                result.append(entity_states)
            
            return result
    except Exception as e:
        log.error(f"Error getting state history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get state history"
        )

@router.get("/history/period/{timestamp}", response_model=List[List[StateOut]], summary="Get State History from Timestamp")
async def get_state_history_from_timestamp(
    timestamp: str,
    filter_entity_id: str = Query(...),
    end_time: Optional[str] = Query(None),
    minimal_response: bool = Query(False),
    no_attributes: bool = Query(False),
    significant_changes_only: bool = Query(False),
    user=Depends(get_verified_user)
):
    """
    Return state history for entities from a specific timestamp.
    
    timestamp: Start time in ISO format
    filter_entity_id: Comma-separated list of entity IDs
    end_time: End time in ISO format
    minimal_response: Only include last_changed and state for intermediate states
    no_attributes: Skip returning attributes
    significant_changes_only: Only return significant state changes
    """
    try:
        # Parse the timestamp as start time
        start_dt = datetime.fromisoformat(timestamp)
        start_ts = start_dt.timestamp()
        
        entity_ids = [eid.strip() for eid in filter_entity_id.split(',')]
        result = []
        
        # Calculate end time (default to now)
        end_dt = datetime.fromisoformat(end_time) if end_time else datetime.utcnow()
        end_ts = end_dt.timestamp()
        
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            for entity_id in entity_ids:
                # Find the metadata for this entity
                meta = db.query(StatesMeta).filter(StatesMeta.entity_id == entity_id).first()
                if not meta:
                    continue
                    
                # Query states for this entity within the time range
                query = db.query(States).filter(
                    and_(
                        States.metadata_id == meta.metadata_id,
                        States.last_updated_ts >= start_ts,
                        States.last_updated_ts <= end_ts
                    )
                ).order_by(States.last_updated_ts)
                
                states = query.all()
                
                # Process states
                entity_states = []
                last_state = None
                for state in states:
                    # Skip insignificant changes if requested
                    state_value = str(getattr(state, 'state', ""))
                    last_state_value = str(getattr(last_state, 'state', "")) if last_state else ""
                    if significant_changes_only and last_state and state_value == last_state_value:
                        continue
                        
                    # Parse attributes
                    attributes = {}
                    if not no_attributes:
                        state_attributes_id = int(str(getattr(state, 'attributes_id', 0)))
                        if state_attributes_id and state_attributes_id > 0:
                            attrs_record = db.query(StateAttributes).filter(
                                StateAttributes.attributes_id == state_attributes_id
                            ).first()
                            attrs_shared_attrs = str(getattr(attrs_record, 'shared_attrs', "")) if attrs_record else ""
                            if attrs_record and attrs_shared_attrs:
                                try:
                                    attributes = json.loads(attrs_shared_attrs)
                                except:
                                    attributes = {}
                        else:
                            state_attrs = str(getattr(state, 'attributes', ""))
                            if state_attrs:
                                try:
                                    attributes = json.loads(state_attrs)
                                except:
                                    attributes = {}
                    
                    # Create context object
                    context = {
                        "id": str(getattr(state, 'context_id', "")),
                        "parent_id": str(getattr(state, 'context_parent_id', "")),
                        "user_id": str(getattr(state, 'context_user_id', ""))
                    }
                    
                    # Create state output
                    if minimal_response and last_state and entity_states:
                        # For minimal response, only include last_changed and state for intermediate states
                        state_out = StateOut(
                            state_id=int(str(getattr(state, 'state_id', 0))),
                            entity_id=entity_id,
                            state=state_value,
                            attributes=attributes if not entity_states else {},  # Only attributes for first and last
                            last_changed=getattr(state, 'last_changed', None),
                            last_updated=getattr(state, 'last_updated', None),
                            context=context if not entity_states else {}  # Only context for first and last
                        )
                    else:
                        state_out = StateOut(
                            state_id=int(str(getattr(state, 'state_id', 0))),
                            entity_id=entity_id,
                            state=state_value,
                            attributes=attributes,
                            last_changed=getattr(state, 'last_changed', None),
                            last_updated=getattr(state, 'last_updated', None),
                            context=context
                        )
                    
                    entity_states.append(state_out)
                    last_state = state
                
                result.append(entity_states)
            
            return result
    except Exception as e:
        log.error(f"Error getting state history from timestamp: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get state history"
        )

############################
# Services Endpoints
############################

@router.get("/services", response_model=List[ServiceOut], summary="Get Services")
async def get_services(user=Depends(get_verified_user)):
    """Return array of domain objects and their services."""
    # This is a stub implementation - in a real system, this would query a service registry
    return [
        ServiceOut(domain="light", services=["turn_on", "turn_off", "toggle"]),
        ServiceOut(domain="switch", services=["turn_on", "turn_off", "toggle"]),
        ServiceOut(domain="cover", services=["open_cover", "close_cover", "stop_cover"]),
        ServiceOut(domain="climate", services=["set_temperature", "set_hvac_mode"]),
        ServiceOut(domain="media_player", services=["play", "pause", "stop", "volume_up", "volume_down"]),
    ]

@router.post("/services/{domain}/{service}", summary="Call Service")
async def call_service(
    domain: str,
    service: str,
    service_data: Optional[Dict[str, Any]] = None,
    user=Depends(get_verified_user)
):
    """Call a service within a specific domain."""
    try:
        # Create an event to record this service call
        event_data = {
            "domain": domain,
            "service": service,
            "service_data": service_data or {}
        }
        
        event = Events(
            event_type="call_service",
            event_data=json.dumps(event_data),
            origin="LOCAL",
            time_fired=datetime.utcnow(),
            time_fired_ts=datetime.utcnow().timestamp()
        )
        
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            db.add(event)
            db.commit()
        
        # In a real implementation, this would actually call the service
        # For now, we just record the event and return success
        return {"status": "success", "message": f"Service {domain}.{service} called"}
    except Exception as e:
        log.error(f"Error calling service {domain}.{service}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to call service"
        )

############################
# Statistics Endpoints
############################

@router.get("/statistics/meta", response_model=List[StatisticsMetaOut], summary="Get Statistics Metadata")
async def get_statistics_meta(user=Depends(get_verified_user)):
    """Return list of statistics metadata."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            meta_list = db.query(StatisticsMeta).all()
            return meta_list
    except Exception as e:
        log.error(f"Error getting statistics metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics metadata"
        )

@router.get("/statistics/{metadata_id}", response_model=List[StatisticsOut], summary="Get Statistics")
async def get_statistics(
    metadata_id: int,
    start_ts: Optional[float] = Query(None),
    end_ts: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    user=Depends(get_verified_user)
):
    """Return statistics for a metadata ID with time range filtering."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            query = db.query(Statistics).filter(Statistics.metadata_id == metadata_id)
            
            if start_ts:
                query = query.filter(Statistics.start_ts >= start_ts)
            if end_ts:
                query = query.filter(Statistics.start_ts <= end_ts)
                
            stats = query.order_by(Statistics.start_ts).limit(limit).all()
            return stats
    except Exception as e:
        log.error(f"Error getting statistics for metadata {metadata_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )

@router.get("/statistics/short_term/{metadata_id}", response_model=List[StatisticsShortTermOut], summary="Get Short Term Statistics")
async def get_short_term_statistics(
    metadata_id: int,
    start_ts: Optional[float] = Query(None),
    end_ts: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    user=Depends(get_verified_user)
):
    """Return short term statistics for a metadata ID with time range filtering."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            query = db.query(StatisticsShortTerm).filter(StatisticsShortTerm.metadata_id == metadata_id)
            
            if start_ts:
                query = query.filter(StatisticsShortTerm.start_ts >= start_ts)
            if end_ts:
                query = query.filter(StatisticsShortTerm.start_ts <= end_ts)
                
            stats = query.order_by(StatisticsShortTerm.start_ts).limit(limit).all()
            return stats
    except Exception as e:
        log.error(f"Error getting short term statistics for metadata {metadata_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get short term statistics"
        )

############################
# Recorder Endpoints
############################

@router.get("/recorder/runs", response_model=List[RecorderRunsOut], summary="Get Recorder Runs")
async def get_recorder_runs(user=Depends(get_verified_user)):
    """Return recorder runs."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            runs = db.query(RecorderRuns).all()
            return runs
    except Exception as e:
        log.error(f"Error getting recorder runs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recorder runs"
        )

@router.get("/schema/changes", response_model=List[SchemaChangesOut], summary="Get Schema Changes")
async def get_schema_changes(user=Depends(get_verified_user)):
    """Return schema changes."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            changes = db.query(SchemaChanges).all()
            return changes
    except Exception as e:
        log.error(f"Error getting schema changes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get schema changes"
        )

@router.get("/migration/changes", response_model=List[MigrationChangesOut], summary="Get Migration Changes")
async def get_migration_changes(user=Depends(get_verified_user)):
    """Return migration changes."""
    try:
        # Use the database context manager properly
        from backend.internal.db import get_db
        with get_db() as db:
            changes = db.query(MigrationChanges).all()
            return changes
    except Exception as e:
        log.error(f"Error getting migration changes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get migration changes"
        )

@router.post("/events")
async def create_event(event_type: str, event_data: Optional[dict] = None):
    """Create a new event."""
    event = EventsCtrl.create_event(event_type, event_data)
    if event:
        return {"event_id": event.event_id, "message": "Event created successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to create event")

@router.get("/events/{event_id}")
async def get_event(event_id: int):
    """Get an event by ID."""
    event = EventsCtrl.get_event_by_id(event_id)
    if event:
        return event
    else:
        raise HTTPException(status_code=404, detail="Event not found")

@router.post("/states")
async def create_state(entity_id: str, state: str, attributes: Optional[dict] = None):
    """Create a new state."""
    state_obj = StatesCtrl.create_state(entity_id, state, attributes)
    if state_obj:
        return {"state_id": state_obj.state_id, "message": "State created successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to create state")

@router.get("/states/{entity_id}")
async def get_latest_state(entity_id: str):
    """Get the latest state for an entity."""
    state = StatesCtrl.get_latest_state_by_entity_id(entity_id)
    if state:
        return state
    else:
        raise HTTPException(status_code=404, detail="State not found")

@router.get("/entities")
async def get_all_entities():
    """Get all entity IDs."""
    entities = StatesMetaCtrl.get_all_entity_ids()
    return {"entities": entities}