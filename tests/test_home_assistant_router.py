"""
Test file for Home Assistant router example.
This file tests that the router can be imported correctly.
"""

import sys
import os

# Add the root directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_router_import():
    """Test that the router can be imported correctly."""
    try:
        from backend.routers.home_assistant_example import router
        
        # Test that the router is instantiated
        assert router is not None
        
        print("Router imported successfully!")
        return True
    except Exception as e:
        print(f"Error importing router: {e}")
        return False

if __name__ == "__main__":
    success = test_router_import()
    if success:
        print("Test passed!")
    else:
        print("Test failed!")
        sys.exit(1)