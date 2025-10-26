'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Device {
  id: number;
  config_entries: string[];
  connections: Record<string, string>;
  identifiers: Record<string, string>;
  manufacturer: string;
  model: string;
  name: string;
  area_id: string | null;
  via_device_id: string | null;
  serial_number: string | null;
  sw_version: string | null;
  hw_version: string | null;
  configuration_url: string | null;
  disabled_by: string | null;
  entry_type: string | null;
  discovery_method: string | null;
}

interface Entity {
  entity_id: string;
  unique_id: string;
  platform: string;
  domain: string;
  name: string;
  device_id: string | null;
  area_id: string | null;
  icon: string | null;
  disabled_by: string | null;
  hidden_by: string | null;
  entity_category: string | null;
  has_entity_name: boolean | null;
  original_name: string | null;
  capabilities: Record<string, any> | null;
  supported_features: number | null;
  device_class: string | null;
  unit_of_measurement: string | null;
  state_class: string | null;
  last_updated: string | null;
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export default function DeviceDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityStates, setEntityStates] = useState<Record<string, EntityState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchEntities();
    connectToEntityWebSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      // This would be implemented to fetch devices from the API
      // For now, we'll use mock data
      const mockDevices: Device[] = [
        {
          id: 1,
          config_entries: ["smartthings"],
          connections: {},
          identifiers: {"smartthings": "device_1"},
          manufacturer: "SmartThings",
          model: "Smart Bulb",
          name: "Living Room Light",
          area_id: null,
          via_device_id: null,
          serial_number: null,
          sw_version: null,
          hw_version: null,
          configuration_url: null,
          disabled_by: null,
          entry_type: null,
          discovery_method: "smartthings"
        },
        {
          id: 2,
          config_entries: ["tuya"],
          connections: {},
          identifiers: {"tuya": "tuya_device_1"},
          manufacturer: "Tuya",
          model: "Smart Plug",
          name: "Kitchen Smart Plug",
          area_id: null,
          via_device_id: null,
          serial_number: null,
          sw_version: null,
          hw_version: null,
          configuration_url: null,
          disabled_by: null,
          entry_type: null,
          discovery_method: "tuya"
        }
      ];
      setDevices(mockDevices);
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      // This would be implemented to fetch entities from the API
      // For now, we'll use mock data
      const mockEntities: Entity[] = [
        {
          entity_id: "light.smartthings_device_1",
          unique_id: "smartthings_device_1",
          platform: "smartthings",
          domain: "light",
          name: "Living Room Light",
          device_id: "1",
          area_id: null,
          icon: null,
          disabled_by: null,
          hidden_by: null,
          entity_category: null,
          has_entity_name: null,
          original_name: null,
          capabilities: null,
          supported_features: null,
          device_class: null,
          unit_of_measurement: null,
          state_class: null,
          last_updated: null
        },
        {
          entity_id: "switch.tuya_tuya_device_1",
          unique_id: "tuya_tuya_device_1",
          platform: "tuya",
          domain: "switch",
          name: "Kitchen Smart Plug",
          device_id: "2",
          area_id: null,
          icon: null,
          disabled_by: null,
          hidden_by: null,
          entity_category: null,
          has_entity_name: null,
          original_name: null,
          capabilities: null,
          supported_features: null,
          device_class: null,
          unit_of_measurement: null,
          state_class: null,
          last_updated: null
        }
      ];
      setEntities(mockEntities);
      
      // Fetch initial states
      const mockStates: Record<string, EntityState> = {
        "light.smartthings_device_1": {
          entity_id: "light.smartthings_device_1",
          state: "on",
          attributes: {brightness: 100},
          last_changed: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        "switch.tuya_tuya_device_1": {
          entity_id: "switch.tuya_tuya_device_1",
          state: "off",
          attributes: {current: "0A"},
          last_changed: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }
      };
      setEntityStates(mockStates);
    } catch (err) {
      setError('Failed to fetch entities');
      console.error('Error fetching entities:', err);
    }
  };

  const connectToEntityWebSocket = () => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Create new Socket.IO connection
    const socket = io('http://localhost:8080', {
      path: '/api/ws/entities',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Connected to entity Socket.IO');
    });
    
    socket.on('state_changed', (data) => {
      try {
        if (data.type === 'state_changed') {
          const { entity_id, new_state } = data.data;
          setEntityStates(prev => ({
            ...prev,
            [entity_id]: {
              entity_id,
              state: new_state.state,
              attributes: new_state.attributes || {},
              last_changed: new Date().toISOString(),
              last_updated: new Date().toISOString()
            }
          }));
        }
      } catch (err) {
        console.error('Error parsing Socket.IO message:', err);
      }
    });
    
    socket.on('event', (data) => {
      // Handle other events if needed
      console.log('Received event:', data);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Entity Socket.IO connection error:', err);
      setError('Entity Socket.IO connection error: ' + err.message);
    });
    
    socket.on('error', (err) => {
      console.error('Entity Socket.IO error:', err);
      setError('Entity Socket.IO error: ' + (err.message || 'Unknown error'));
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Entity Socket.IO connection closed:', reason);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });
    
    socketRef.current = socket;
  };

  const handleControlDevice = async (entityId: string, domain: string, service: string) => {
    try {
      const response = await apiClient.callHomeAssistantService(domain, service, {
        entity_id: entityId
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Successfully sent command to ${entityId}`
        });
      } else {
        setError(response.error || 'Failed to control device');
        toast({
          title: 'Error',
          description: response.error || 'Failed to control device',
          variant: 'destructive'
        });
      }
    } catch (err) {
      setError('Failed to control device');
      console.error('Error controlling device:', err);
      toast({
        title: 'Error',
        description: 'Failed to control device',
        variant: 'destructive'
      });
    }
  };

  const toggleEntity = (entity: Entity) => {
    const currentState = entityStates[entity.entity_id]?.state;
    const newState = currentState === 'on' ? 'off' : 'on';
    const service = newState === 'on' ? 'turn_on' : 'turn_off';
    
    handleControlDevice(entity.entity_id, entity.domain, service);
  };

  if (loading) {
    return <div className="p-4">Loading devices and entities...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Manage your smart home devices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.manufacturer}</TableCell>
                  <TableCell>{device.model}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {device.discovery_method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Online</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Entities</CardTitle>
              <CardDescription>Control your smart home entities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => {
                const state = entityStates[entity.entity_id];
                return (
                  <TableRow key={entity.entity_id}>
                    <TableCell className="font-medium">{entity.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entity.domain}</Badge>
                    </TableCell>
                    <TableCell>
                      {state ? (
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${
                            state.state === 'on' ? 'bg-green-500' : 'bg-gray-300'
                          }`}></span>
                          <span>{state.state}</span>
                          {state.attributes && Object.keys(state.attributes).length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({Object.entries(state.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entity.domain === 'light' || entity.domain === 'switch' ? (
                        <Switch
                          checked={state?.state === 'on'}
                          onCheckedChange={() => toggleEntity(entity)}
                        />
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleControlDevice(entity.entity_id, entity.domain, 'turn_on')}
                        >
                          Control
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}