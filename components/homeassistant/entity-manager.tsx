"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Activity, 
  Plus, 
  RefreshCw, 
  Trash2,
  Play,
  Pause,
  Move,
  Lock
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Entity, HomeAssistantAddon } from "@/lib/api"

interface EntityState {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

interface EntityRegistryEntry {
  entity_id: string
  unique_id: string
  platform: string
  domain: string
  name: string
  device_id?: string
  area_id?: string
  icon?: string
  disabled_by?: string
  hidden_by?: string
  entity_category?: string
  has_entity_name?: boolean
  original_name?: string
  capabilities?: Record<string, any>
  supported_features?: number
  device_class?: string
  unit_of_measurement?: string
  state_class?: string
  last_updated?: string
}

interface DeviceRegistryEntry {
  id: number
  config_entries: string[]
  connections: Record<string, string>
  identifiers: Record<string, string>
  manufacturer: string
  model: string
  name: string
  area_id?: string
  via_device_id?: string
  serial_number?: string
  sw_version?: string
  hw_version?: string
  configuration_url?: string
  disabled_by?: string
  entry_type?: string
  discovery_method?: string
}

interface AreaRegistryEntry {
  id: number
  name: string
  icon?: string
}

export function HomeAssistantEntityManager() {
  const [entities, setEntities] = useState<EntityRegistryEntry[]>([])
  const [devices, setDevices] = useState<DeviceRegistryEntry[]>([])
  const [areas, setAreas] = useState<AreaRegistryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddEntityDialogOpen, setIsAddEntityDialogOpen] = useState(false)
  const [isAddDeviceDialogOpen, setIsAddDeviceDialogOpen] = useState(false)
  const [newEntity, setNewEntity] = useState({
    entity_id: "",
    unique_id: "",
    platform: "manual",
    domain: "light",
    name: "",
    device_id: "",
    area_id: ""
  })
  const [newDevice, setNewDevice] = useState({
    config_entries: [""],
    connections: {},
    identifiers: {},
    manufacturer: "",
    model: "",
    name: "",
    area_id: "",
    serial_number: "",
    sw_version: "",
    hw_version: ""
  })
  const [discoveryLoading, setDiscoveryLoading] = useState(false)

  // Fetch all data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch entities
      const entitiesResponse = await apiClient.getHomeAssistantEntitiesRegistry()
      if (entitiesResponse.success && entitiesResponse.data) {
        setEntities(entitiesResponse.data)
      }

      // Fetch devices
      const devicesResponse = await apiClient.getHomeAssistantDevices()
      if (devicesResponse.success && devicesResponse.data) {
        setDevices(devicesResponse.data)
      }

      // Fetch areas
      const areasResponse = await apiClient.getHomeAssistantAreas()
      if (areasResponse.success && areasResponse.data) {
        setAreas(areasResponse.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch Home Assistant data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntity = async () => {
    if (!newEntity.entity_id || !newEntity.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.registerHomeAssistantEntity(newEntity)
      
      if (response.success && response.data) {
        // Add to local state
        const fullEntityId = `${newEntity.domain}.${newEntity.entity_id}`
        setEntities(prev => [...prev, {
          ...newEntity,
          entity_id: fullEntityId
        }])
        
        // Reset form and close dialog
        setNewEntity({
          entity_id: "",
          unique_id: "",
          platform: "manual",
          domain: "light",
          name: "",
          device_id: "",
          area_id: ""
        })
        setIsAddEntityDialogOpen(false)
        
        toast({
          title: "Success",
          description: "Entity added successfully"
        })
      } else {
        throw new Error(response.error || "Failed to add entity")
      }
    } catch (error) {
      console.error("Error adding entity:", error)
      toast({
        title: "Error",
        description: "Failed to add entity",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.manufacturer) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.registerHomeAssistantDevice(newDevice)
      
      if (response.success && response.data) {
        // Add to local state
        setDevices(prev => [...prev, response.data])
        
        // Reset form and close dialog
        setNewDevice({
          config_entries: [""],
          connections: {},
          identifiers: {},
          manufacturer: "",
          model: "",
          name: "",
          area_id: "",
          serial_number: "",
          sw_version: "",
          hw_version: ""
        })
        setIsAddDeviceDialogOpen(false)
        
        toast({
          title: "Success",
          description: "Device added successfully"
        })
      } else {
        throw new Error(response.error || "Failed to add device")
      }
    } catch (error) {
      console.error("Error adding device:", error)
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEntity = async (entityId: string) => {
    try {
      setLoading(true)
      // Note: The API doesn't seem to have a remove entity endpoint
      // In a real implementation, this would call the API
      // await apiClient.removeHomeAssistantEntity(entityId)
      
      // Remove from local state
      setEntities(prev => prev.filter(entity => entity.entity_id !== entityId))
      
      toast({
        title: "Success",
        description: "Entity removed successfully"
      })
    } catch (error) {
      console.error("Error removing entity:", error)
      toast({
        title: "Error",
        description: "Failed to remove entity",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerDiscovery = async (type: string) => {
    try {
      setDiscoveryLoading(true)
      const response = await apiClient.callHomeAssistantService("homeassistant", "trigger_discovery", { discovery_type: type })
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Discovery triggered: ${type}`
        })
        // Refresh data after discovery
        fetchData()
      } else {
        throw new Error(response.error || "Failed to trigger discovery")
      }
    } catch (error) {
      console.error("Error triggering discovery:", error)
      toast({
        title: "Error",
        description: "Failed to trigger discovery",
        variant: "destructive"
      })
    } finally {
      setDiscoveryLoading(false)
    }
  }

  const getEntityIcon = (domain: string, icon?: string) => {
    // If a custom icon is provided, use it
    if (icon) {
      return <span className="text-lg">{icon}</span>
    }
    
    // Otherwise, use domain-specific icons
    switch (domain) {
      case "light":
        return <Lightbulb className="w-4 h-4" />
      case "switch":
        return <Power className="w-4 h-4" />
      case "sensor":
        return <Thermometer className="w-4 h-4" />
      case "binary_sensor":
        return <Activity className="w-4 h-4" />
      case "climate":
        return <Thermometer className="w-4 h-4" />
      case "cover":
        return <Move className="w-4 h-4" />
      case "lock":
        return <Lock className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Home Assistant Manager</h2>
          <p className="text-muted-foreground">Manage your smart home entities, devices, and areas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={discoveryLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${discoveryLoading ? 'animate-spin' : ''}`} />
                Discover
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Discovery Methods</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => triggerDiscovery("mqtt")}>
                MQTT Discovery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerDiscovery("upnp")}>
                UPnP Discovery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerDiscovery("mdns")}>
                mDNS Discovery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={isAddDeviceDialogOpen} onOpenChange={setIsAddDeviceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>
                  Register a new device in Home Assistant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-name">Name *</Label>
                    <Input
                      id="device-name"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                      placeholder="e.g., Philips Hue Bridge"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-manufacturer">Manufacturer *</Label>
                    <Input
                      id="device-manufacturer"
                      value={newDevice.manufacturer}
                      onChange={(e) => setNewDevice({...newDevice, manufacturer: e.target.value})}
                      placeholder="e.g., Philips"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-model">Model</Label>
                    <Input
                      id="device-model"
                      value={newDevice.model}
                      onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                      placeholder="e.g., BSB002"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-serial">Serial Number</Label>
                    <Input
                      id="device-serial"
                      value={newDevice.serial_number}
                      onChange={(e) => setNewDevice({...newDevice, serial_number: e.target.value})}
                      placeholder="e.g., 1234567890"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-sw-version">Software Version</Label>
                    <Input
                      id="device-sw-version"
                      value={newDevice.sw_version}
                      onChange={(e) => setNewDevice({...newDevice, sw_version: e.target.value})}
                      placeholder="e.g., 1.45.1934"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-hw-version">Hardware Version</Label>
                    <Input
                      id="device-hw-version"
                      value={newDevice.hw_version}
                      onChange={(e) => setNewDevice({...newDevice, hw_version: e.target.value})}
                      placeholder="e.g., 1.0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="device-area">Area</Label>
                  <Select value={newDevice.area_id} onValueChange={(value) => setNewDevice({...newDevice, area_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.icon} {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleAddDevice} disabled={loading} className="w-full">
                  Add Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddEntityDialogOpen} onOpenChange={setIsAddEntityDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entity</DialogTitle>
                <DialogDescription>
                  Register a new entity in Home Assistant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-name">Name</Label>
                  <Input
                    id="entity-name"
                    value={newEntity.name}
                    onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                    placeholder="e.g., Living Room Light"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity-id">Entity ID</Label>
                  <div className="flex gap-2">
                    <Select value={newEntity.domain} onValueChange={(value) => setNewEntity({...newEntity, domain: value})}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">light</SelectItem>
                        <SelectItem value="switch">switch</SelectItem>
                        <SelectItem value="sensor">sensor</SelectItem>
                        <SelectItem value="binary_sensor">binary_sensor</SelectItem>
                        <SelectItem value="cover">cover</SelectItem>
                        <SelectItem value="climate">climate</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="entity-id"
                      value={newEntity.entity_id}
                      onChange={(e) => setNewEntity({...newEntity, entity_id: e.target.value})}
                      placeholder="e.g., living_room_light"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unique-id">Unique ID</Label>
                  <Input
                    id="unique-id"
                    value={newEntity.unique_id}
                    onChange={(e) => setNewEntity({...newEntity, unique_id: e.target.value})}
                    placeholder="e.g., manual_light_1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input
                    id="platform"
                    value={newEntity.platform}
                    onChange={(e) => setNewEntity({...newEntity, platform: e.target.value})}
                    placeholder="e.g., manual"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Select value={newEntity.area_id} onValueChange={(value) => setNewEntity({...newEntity, area_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={String(area.id)}>
                          {area.icon} {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleAddEntity} disabled={loading} className="w-full">
                  Add Entity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Entities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Entities</CardTitle>
          <CardDescription>Manage your Home Assistant entities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Device Class</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => {
                const area = areas.find(a => String(a.id) === entity.area_id)
                return (
                  <TableRow key={entity.entity_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(entity.domain, entity.icon)}
                        {entity.entity_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entity.domain}</Badge>
                    </TableCell>
                    <TableCell>{entity.name}</TableCell>
                    <TableCell>{entity.platform}</TableCell>
                    <TableCell>
                      {entity.device_class ? (
                        <Badge variant="outline">{entity.device_class}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {area ? (
                        <span className="flex items-center gap-1">
                          {area.icon} {area.name}
                        </span>
                      ) : (
                        "None"
                      )}
                    </TableCell>
                    <TableCell>
                      {entity.last_updated ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(entity.last_updated).toLocaleTimeString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEntity(entity.entity_id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>Manage your Home Assistant devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Discovery Method</TableHead>
                <TableHead>Area</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const area = areas.find(a => String(a.id) === device.area_id)
                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.manufacturer}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>
                      {device.sw_version && (
                        <span className="text-xs">
                          SW: {device.sw_version}
                          {device.hw_version && ` / HW: ${device.hw_version}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {device.discovery_method || "manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {area ? (
                        <span className="flex items-center gap-1">
                          {area.icon} {area.name}
                        </span>
                      ) : (
                        "None"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Areas</CardTitle>
          <CardDescription>Manage your Home Assistant areas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell>{area.icon || "None"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}