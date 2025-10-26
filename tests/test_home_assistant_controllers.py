"""
Test file for Home Assistant controllers.
This file tests that the controllers can be imported and instantiated correctly.
"""

import sys
import os

# Add the root directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_controllers_import():
    """Test that all controllers can be imported correctly."""
    try:
        from backend.models.home_assistant_controllers import (
            EventsCtrl, StatesCtrl, StatisticsCtrl, StatesMetaCtrl,
            EventDataCtrl, EventTypesCtrl, StateAttributesCtrl,
            StatisticsMetaCtrl, RecorderRunsCtrl, SchemaChangesCtrl,
            MigrationChangesCtrl, StatisticsShortTermCtrl, StatisticsRunsCtrl
        )
        
        # Test that all controllers are instantiated
        assert EventsCtrl is not None
        assert StatesCtrl is not None
        assert StatisticsCtrl is not None
        assert StatesMetaCtrl is not None
        assert EventDataCtrl is not None
        assert EventTypesCtrl is not None
        assert StateAttributesCtrl is not None
        assert StatisticsMetaCtrl is not None
        assert RecorderRunsCtrl is not None
        assert SchemaChangesCtrl is not None
        assert MigrationChangesCtrl is not None
        assert StatisticsShortTermCtrl is not None
        assert StatisticsRunsCtrl is not None
        
        print("All controllers imported successfully!")
        return True
    except Exception as e:
        print(f"Error importing controllers: {e}")
        return False

if __name__ == "__main__":
    success = test_controllers_import()
    if success:
        print("Test passed!")
    else:
        print("Test failed!")
        sys.exit(1)