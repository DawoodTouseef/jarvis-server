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
  Lock,
  Volume2,
  Sun,
  Moon,
  Zap,
  Droplets
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface EntityState {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
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

export function HomeAssistantDeviceControlPanel() {
  const [entities, setEntities] = useState<EntityState[]>([])
  const [devices, setDevices] = useState<DeviceRegistryEntry[]>([])
  const [areas, setAreas] = useState<AreaRegistryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<EntityState | null>(null)

  // Fetch all data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch entities
      const entitiesResponse = await apiClient.getHomeAssistantEntities()
      if (entitiesResponse.success && entitiesResponse.data) {
        // Transform Entity[] to EntityState[]
        const entityStates: EntityState[] = entitiesResponse.data.map((entity: any) => ({
          entity_id: entity.entity_id,
          state: entity.state,
          attributes: entity.attributes || {},
          last_changed: entity.last_changed || new Date().toISOString(),
          last_updated: entity.last_updated || new Date().toISOString()
        }))
        setEntities(entityStates)
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

  const handleServiceCall = async (domain: string, service: string, entityId: string, extraData: Record<string, any> = {}) => {
    try {
      setLoading(true)
      const serviceData = { entity_id: entityId, ...extraData }
      const response = await apiClient.callHomeAssistantService(domain, service, serviceData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Service ${service} called successfully`
        })
        
        // Refresh entities after service call
        fetchData()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to call service",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error calling service:", error)
      toast({
        title: "Error",
        description: "Failed to call service",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getEntityIcon = (domain: string, state: string, icon?: string) => {
    // If a custom icon is provided, use it
    if (icon) {
      return <span className="text-lg">{icon}</span>
    }
    
    // Otherwise, use domain-specific icons with state-based coloring
    const isOn = state === "on" || state === "home" || state === "playing" || state === "open"
    
    switch (domain) {
      case "light":
        return isOn ? <Lightbulb className="w-4 h-4 text-yellow-500" /> : <Lightbulb className="w-4 h-4 text-gray-400" />
      case "switch":
        return isOn ? <Power className="w-4 h-4 text-green-500" /> : <Power className="w-4 h-4 text-gray-400" />
      case "sensor":
        return <Thermometer className="w-4 h-4" />
      case "binary_sensor":
        return isOn ? <Activity className="w-4 h-4 text-green-500" /> : <Activity className="w-4 h-4 text-gray-400" />
      case "climate":
        return <Thermometer className="w-4 h-4" />
      case "cover":
        return isOn ? <Move className="w-4 h-4 text-blue-500" /> : <Move className="w-4 h-4 text-gray-400" />
      case "lock":
        return isOn ? <Lock className="w-4 h-4 text-red-500" /> : <Lock className="w-4 h-4 text-green-500" />
      case "media_player":
        return isOn ? <Volume2 className="w-4 h-4 text-purple-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getEntityDomain = (entityId: string) => {
    return entityId.split(".")[0]
  }

  const openControlDialog = (entity: EntityState) => {
    setSelectedEntity(entity)
    setIsControlDialogOpen(true)
  }

  const renderEntityControl = (entity: EntityState) => {
    const domain = getEntityDomain(entity.entity_id)
    
    switch (domain) {
      case "light":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={entity.state === "on"}
              onCheckedChange={(checked) => 
                handleServiceCall(domain, checked ? "turn_on" : "turn_off", entity.entity_id)
              }
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openControlDialog(entity)}
            >
              Control
            </Button>
          </div>
        )
      case "switch":
        return (
          <Switch
            checked={entity.state === "on"}
            onCheckedChange={(checked) => 
              handleServiceCall(domain, checked ? "turn_on" : "turn_off", entity.entity_id)
            }
          />
        )
      case "cover":
        return (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "open_cover", entity.entity_id)}
              disabled={entity.state === "open"}
            >
              Open
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "close_cover", entity.entity_id)}
              disabled={entity.state === "closed"}
            >
              Close
            </Button>
          </div>
        )
      case "lock":
        return (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "unlock", entity.entity_id)}
              disabled={entity.state === "unlocked"}
            >
              Unlock
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "lock", entity.entity_id)}
              disabled={entity.state === "locked"}
            >
              Lock
            </Button>
          </div>
        )
      case "media_player":
        return (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "media_play", entity.entity_id)}
              disabled={entity.state === "playing"}
            >
              Play
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "media_pause", entity.entity_id)}
              disabled={entity.state === "paused"}
            >
              Pause
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleServiceCall(domain, "media_stop", entity.entity_id)}
            >
              Stop
            </Button>
          </div>
        )
      case "climate":
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openControlDialog(entity)}
          >
            Control
          </Button>
        )
      default:
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openControlDialog(entity)}
          >
            View
          </Button>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Device Control Panel</h2>
          <p className="text-muted-foreground">Control your smart home devices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Control Entities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Control Entities</CardTitle>
          <CardDescription>Control your smart home entities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => {
                const domain = getEntityDomain(entity.entity_id)
                return (
                  <TableRow key={entity.entity_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(domain, entity.state, entity.attributes?.icon)}
                        {entity.entity_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{domain}</Badge>
                    </TableCell>
                    <TableCell>{entity.attributes?.friendly_name || entity.entity_id.split(".")[1]}</TableCell>
                    <TableCell>
                      <Badge variant={entity.state === "on" || entity.state === "home" ? "default" : "secondary"}>
                        {entity.state}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderEntityControl(entity)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Control Dialog */}
      <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Entity Control</DialogTitle>
            <DialogDescription>
              Control {selectedEntity?.entity_id}
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <EntityControlDialog 
              entity={selectedEntity} 
              onClose={() => setIsControlDialogOpen(false)}
              onServiceCall={handleServiceCall}
              areas={areas}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface EntityControlDialogProps {
  entity: EntityState
  onClose: () => void
  onServiceCall: (domain: string, service: string, entityId: string, extraData?: Record<string, any>) => void
  areas: AreaRegistryEntry[]
}

const EntityControlDialog = ({ entity, onClose, onServiceCall, areas }: EntityControlDialogProps) => {
  const domain = entity.entity_id.split(".")[0]
  const [brightness, setBrightness] = useState(entity.attributes?.brightness || 255)
  const [temperature, setTemperature] = useState(entity.attributes?.temperature || 22)
  const [hvacMode, setHvacMode] = useState(entity.attributes?.hvac_mode || "off")
  const [fanMode, setFanMode] = useState(entity.attributes?.fan_mode || "auto")
  const [volume, setVolume] = useState(entity.attributes?.volume_level || 0.5)

  const handleLightControl = () => {
    onServiceCall(domain, "turn_on", entity.entity_id, { brightness })
    onClose()
  }

  const handleClimateControl = () => {
    onServiceCall(domain, "set_temperature", entity.entity_id, { temperature })
    onServiceCall(domain, "set_hvac_mode", entity.entity_id, { hvac_mode: hvacMode })
    onServiceCall(domain, "set_fan_mode", entity.entity_id, { fan_mode: fanMode })
    onClose()
  }

  const handleMediaControl = () => {
    onServiceCall(domain, "volume_set", entity.entity_id, { volume_level: volume })
    onClose()
  }

  switch (domain) {
    case "light":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Brightness: {Math.round((brightness / 255) * 100)}%</Label>
            <Input
              type="range"
              min="0"
              max="255"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLightControl}>Set Brightness</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )
    case "climate":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature: {temperature}°C</Label>
            <Input
              type="range"
              min="10"
              max="30"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>HVAC Mode</Label>
            <Select value={hvacMode} onValueChange={setHvacMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="heat">Heat</SelectItem>
                <SelectItem value="cool">Cool</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="dry">Dry</SelectItem>
                <SelectItem value="fan_only">Fan Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fan Mode</Label>
            <Select value={fanMode} onValueChange={setFanMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleClimateControl}>Set Climate</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )
    case "media_player":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Volume: {Math.round(volume * 100)}%</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleMediaControl}>Set Volume</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )
    default:
      return (
        <div className="space-y-4">
          <div className="text-sm">
            <p><strong>Entity ID:</strong> {entity.entity_id}</p>
            <p><strong>State:</strong> {entity.state}</p>
            <p><strong>Last Changed:</strong> {new Date(entity.last_changed).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(entity.last_updated).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      )
  }
}