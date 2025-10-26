import pytest
from datetime import datetime
from backend.models.homeassistant import (
    States, Events, EventData, EventTypes, StateAttributes, StatesMeta, 
    StatisticsMeta, Statistics, StatisticsShortTerm, MigrationChanges
)

def test_database_model_definitions():
    """Test that all database models are properly defined"""
    # Test States model columns
    assert hasattr(States, 'state_id')
    assert hasattr(States, 'entity_id')
    assert hasattr(States, 'state')
    assert hasattr(States, 'attributes')
    assert hasattr(States, 'last_changed_ts')
    assert hasattr(States, 'last_updated_ts')
    assert hasattr(States, 'metadata_id')
    
    # Test Events model columns
    assert hasattr(Events, 'event_id')
    assert hasattr(Events, 'event_type')
    assert hasattr(Events, 'time_fired_ts')
    assert hasattr(Events, 'event_type_id')
    
    # Test EventData model columns
    assert hasattr(EventData, 'data_id')
    assert hasattr(EventData, 'hash')
    assert hasattr(EventData, 'shared_data')
    
    # Test EventTypes model columns
    assert hasattr(EventTypes, 'event_type_id')
    assert hasattr(EventTypes, 'event_type')
    
    # Test StateAttributes model columns
    assert hasattr(StateAttributes, 'attributes_id')
    assert hasattr(StateAttributes, 'hash')
    assert hasattr(StateAttributes, 'shared_attrs')
    
    # Test StatesMeta model columns
    assert hasattr(StatesMeta, 'metadata_id')
    assert hasattr(StatesMeta, 'entity_id')
    
    # Test StatisticsMeta model columns
    assert hasattr(StatisticsMeta, 'id')
    assert hasattr(StatisticsMeta, 'statistic_id')
    assert hasattr(StatisticsMeta, 'source')
    assert hasattr(StatisticsMeta, 'unit_of_measurement')
    assert hasattr(StatisticsMeta, 'has_mean')
    assert hasattr(StatisticsMeta, 'has_sum')
    assert hasattr(StatisticsMeta, 'name')
    
    # Test Statistics model columns
    assert hasattr(Statistics, 'id')
    assert hasattr(Statistics, 'created_ts')
    assert hasattr(Statistics, 'start_ts')
    assert hasattr(Statistics, 'mean')
    assert hasattr(Statistics, 'min')
    assert hasattr(Statistics, 'max')
    assert hasattr(Statistics, 'state')
    assert hasattr(Statistics, 'metadata_id')
    
    # Test StatisticsShortTerm model columns
    assert hasattr(StatisticsShortTerm, 'id')
    assert hasattr(StatisticsShortTerm, 'created_ts')
    assert hasattr(StatisticsShortTerm, 'start_ts')
    assert hasattr(StatisticsShortTerm, 'mean')
    assert hasattr(StatisticsShortTerm, 'min')
    assert hasattr(StatisticsShortTerm, 'max')
    assert hasattr(StatisticsShortTerm, 'state')
    assert hasattr(StatisticsShortTerm, 'metadata_id')
    
    # Test MigrationChanges model columns
    assert hasattr(MigrationChanges, 'migration_id')
    assert hasattr(MigrationChanges, 'version')

def test_foreign_key_relationships():
    """Test that foreign key relationships are properly defined"""
    # Test that States model has the correct foreign key columns
    assert 'old_state_id' in States.__table__.c
    assert 'attributes_id' in States.__table__.c
    assert 'metadata_id' in States.__table__.c
    
    # Test that Events model has the correct foreign key columns
    assert 'data_id' in Events.__table__.c
    assert 'event_type_id' in Events.__table__.c
    
    # Test that Statistics models have the correct foreign key columns
    assert 'metadata_id' in Statistics.__table__.c
    assert 'metadata_id' in StatisticsShortTerm.__table__.c
    
    # Test that the tables have the correct names (matching the schema)
    assert States.__tablename__ == "states"
    assert Events.__tablename__ == "events"
    assert EventData.__tablename__ == "event_data"
    assert EventTypes.__tablename__ == "event_types"
    assert StateAttributes.__tablename__ == "state_attributes"
    assert StatesMeta.__tablename__ == "states_meta"
    assert StatisticsMeta.__tablename__ == "statistics_meta"
    assert Statistics.__tablename__ == "statistics"
    assert StatisticsShortTerm.__tablename__ == "statistics_short_term"
    assert MigrationChanges.__tablename__ == "migration_changes"