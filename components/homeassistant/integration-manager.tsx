'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Integration {
  id: number;
  integration_id: string;
  name: string;
  description: string | null;
  version: string;
  enabled: boolean;
  config: any | null;
  manifest: any | null;
  installed_at: string;
  updated_at: string;
}

interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  config_fields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
  }>;
}

interface FlowEvent {
  flow_id: string;
  event_type: string;
  timestamp: string;
  data: {
    step?: string;
    message?: string;
    success?: boolean;
  };
}

export default function IntegrationManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);
  const [configData, setConfigData] = useState<Record<string, any>>({});
  const [flowEvents, setFlowEvents] = useState<FlowEvent[]>([]);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [flowId, setFlowId] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchIntegrations();
    fetchAvailableIntegrations();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHomeAssistantIntegrations();
      if (response.success && response.data) {
        setIntegrations(response.data);
      }
    } catch (err) {
      setError('Failed to fetch integrations');
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableIntegrations = async () => {
    try {
      const response = await apiClient.getAvailableIntegrations();
      if (response.success && response.data) {
        setAvailableIntegrations(response.data);
      }
    } catch (err) {
      setError('Failed to fetch available integrations');
      console.error('Error fetching available integrations:', err);
    }
  };

  const handleConfigureIntegration = (integration: AvailableIntegration) => {
    setSelectedIntegration(integration);
    setConfigData({});
    setIsConfigDialogOpen(true);
  };

  const handleConfigChange = (fieldId: string, value: string) => {
    setConfigData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleStartFlow = async () => {
    if (!selectedIntegration) return;
    
    try {
      setIsFlowActive(true);
      setFlowEvents([]);
      
      // Connect to WebSocket for flow updates
      connectToFlowWebSocket();
      
      // Start the configuration flow
      const response = await apiClient.startIntegrationFlow(
        selectedIntegration.id,
        configData
      );
      
      if (response.success && response.data) {
        setFlowId(response.data.flow_id);
      } else {
        setError(response.error || 'Failed to start integration flow');
        setIsFlowActive(false);
      }
    } catch (err) {
      setError('Failed to start integration flow');
      console.error('Error starting integration flow:', err);
      setIsFlowActive(false);
    }
  };

  const connectToFlowWebSocket = () => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Create new Socket.IO connection
    const socket = io('http://localhost:8080', {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Connected to integration flow Socket.IO');
    });
    
    socket.on('flow_started', (data) => {
      setFlowEvents(prev => [...prev, data]);
    });
    
    socket.on('flow_progress', (data) => {
      setFlowEvents(prev => [...prev, data]);
    });
    
    socket.on('flow_completed', (data) => {
      setFlowEvents(prev => [...prev, data]);
      setIsFlowActive(false);
      if (data.data?.success) {
        toast({
          title: 'Success',
          description: 'Integration configured successfully!'
        });
        // Refresh integrations list
        fetchIntegrations();
      } else {
        toast({
          title: 'Error',
          description: data.data?.message || 'Failed to configure integration',
          variant: 'destructive'
        });
      }
    });
    
    socket.on('connect_error', (err) => {
      console.error('Integration flow Socket.IO connection error:', err);
      setError('Integration flow Socket.IO connection error: ' + err.message);
    });
    
    socket.on('error', (err) => {
      console.error('Socket.IO error:', err);
      setError('Socket.IO error: ' + (err.message || 'Unknown error'));
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO connection closed:', reason);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });
    
    socketRef.current = socket;
  };

  const handleEnableIntegration = async (integrationId: string) => {
    try {
      const response = await apiClient.enableHomeAssistantIntegration(integrationId);
      if (response.success) {
        fetchIntegrations();
        toast({
          title: 'Success',
          description: 'Integration enabled successfully'
        });
      } else {
        setError(response.error || 'Failed to enable integration');
      }
    } catch (err) {
      setError('Failed to enable integration');
      console.error('Error enabling integration:', err);
    }
  };

  const handleDisableIntegration = async (integrationId: string) => {
    try {
      const response = await apiClient.disableHomeAssistantIntegration(integrationId);
      if (response.success) {
        fetchIntegrations();
        toast({
          title: 'Success',
          description: 'Integration disabled successfully'
        });
      } else {
        setError(response.error || 'Failed to disable integration');
      }
    } catch (err) {
      setError('Failed to disable integration');
      console.error('Error disabling integration:', err);
    }
  };

  if (loading) {
    return <div className="p-4">Loading integrations...</div>;
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
              <CardTitle>Home Assistant Integrations</CardTitle>
              <CardDescription>Manage your Home Assistant integrations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell className="font-medium">{integration.name}</TableCell>
                  <TableCell>{integration.integration_id}</TableCell>
                  <TableCell>{integration.version}</TableCell>
                  <TableCell>
                    <Badge variant={integration.enabled ? "default" : "secondary"}>
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {integration.enabled ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisableIntegration(integration.integration_id)}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEnableIntegration(integration.integration_id)}
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>Discover and add new integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => (
              <Card key={integration.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                    <Badge variant="secondary" className="mt-2">
                      {integration.category}
                    </Badge>
                  </div>
                  {integration.icon && (
                    <img 
                      src={integration.icon} 
                      alt={integration.name} 
                      className="w-10 h-10 object-contain"
                    />
                  )}
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => handleConfigureIntegration(integration)}
                    className="w-full"
                  >
                    Add Integration
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration ? `Configure ${selectedIntegration.name}` : 'Configure Integration'}
            </DialogTitle>
          </DialogHeader>
          
          {isFlowActive ? (
            <div className="space-y-4">
              <h3 className="font-medium">Configuration Progress</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {flowEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm">
                        {event.data?.message || `${event.event_type} at ${new Date(event.timestamp).toLocaleTimeString()}`}
                      </p>
                      {event.data?.step && (
                        <p className="text-xs text-muted-foreground">Step: {event.data.step}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : selectedIntegration ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedIntegration.description}
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedIntegration.config_fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === 'password' ? (
                      <Input
                        id={field.id}
                        type="password"
                        value={configData[field.id] || ''}
                        onChange={(e) => handleConfigChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type="text"
                        value={configData[field.id] || ''}
                        onChange={(e) => handleConfigChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStartFlow}>
                  Start Configuration
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>No integration selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}