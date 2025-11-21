
"""
Test script for WebSocket CRUD operations on States table
"""
import asyncio
import json
import websockets
import os
from typing import Dict, Any

# Test WebSocket CRUD operations for States
async def test_states_crud():
    # Get the server URL from environment or use default
    server_url = os.getenv("WEBSOCKET_URL", "ws://localhost:8080/api/ws")
    
    try:
        # Connect to WebSocket server
        async with websockets.connect(server_url) as websocket:
            print(f"Connected to {server_url}")
            
            # Wait for connection to be established
            await asyncio.sleep(1)
            
            # Test 1: Create a new state
            print("\n1. Testing state creation...")
            create_msg = {
                "type": "states:create",
                "entity_id": "light.test_websocket",
                "state": "on",
                "attributes": {
                    "brightness": 100,
                    "color": "white"
                }
            }
            await websocket.send(json.dumps(create_msg))
            print(f"Sent: {json.dumps(create_msg, indent=2)}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Parse response to get state_id for later tests
            state_id = None
            try:
                response_data = json.loads(response)
                if isinstance(response_data, dict) and response_data.get("success"):
                    state_id = response_data.get("data", {}).get("state_id")
                    print(f"Created state with ID: {state_id}")
            except json.JSONDecodeError:
                print("Could not parse response")
            
            # Wait a bit
            await asyncio.sleep(1)
            
            # Test 2: Get the state we just created
            print("\n2. Testing state retrieval...")
            get_msg = {
                "type": "states:get",
                "entity_id": "light.test_websocket"
            }
            await websocket.send(json.dumps(get_msg))
            print(f"Sent: {json.dumps(get_msg, indent=2)}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Wait a bit
            await asyncio.sleep(1)
            
            # Test 3: Update the state if we have a valid state_id
            if state_id:
                print("\n3. Testing state update...")
                update_msg = {
                    "type": "states:update",
                    "state_id": state_id,
                    "state": "off",
                    "attributes": {
                        "brightness": 0,
                        "color": "black"
                    }
                }
                await websocket.send(json.dumps(update_msg))
                print(f"Sent: {json.dumps(update_msg, indent=2)}")
                
                # Wait for response
                response = await websocket.recv()
                print(f"Received: {response}")
                
                # Wait a bit
                await asyncio.sleep(1)
            
            # Test 4: Delete the state if we have a valid state_id
            if state_id:
                print("\n4. Testing state deletion...")
                delete_msg = {
                    "type": "states:delete",
                    "state_id": state_id
                }
                await websocket.send(json.dumps(delete_msg))
                print(f"Sent: {json.dumps(delete_msg, indent=2)}")
                
                # Wait for response
                response = await websocket.recv()
                print(f"Received: {response}")
            
            print("\nAll tests completed!")
            
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed unexpectedly")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing WebSocket CRUD operations for States...")
    asyncio.run(test_states_crud())