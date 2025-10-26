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
  Settings,
  Zap,
  Cpu,
  Database
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

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

interface HomeAssistantAutomation {
  id: number
  automation_id: string
  name: string
  description?: string
  enabled: boolean
  trigger: any[]
  condition?: any[]
  action: any[]
  mode?: string
  max_exceeded?: string
  variables?: Record<string, any>
  last_triggered?: string
  created: string
  updated: string
}

interface HomeAssistantAddon {
  id: number
  addon_id: string
  name: string
  description: string | null
  version: string
  enabled: boolean
  config: any | null
  manifest: any | null
  installed_at: string
  updated_at: string
  repository_url: string | null
  installed_from: string | null
}

export function HomeAssistantDashboard() {
  const [entities, setEntities] = useState<EntityRegistryEntry[]>([])
  const [devices, setDevices] = useState<DeviceRegistryEntry[]>([])
  const [areas, setAreas] = useState<AreaRegistryEntry[]>([])
  const [automations, setAutomations] = useState<HomeAssistantAutomation[]>([])
  const [addons, setAddons] = useState<HomeAssistantAddon[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("entities")
  const [recorderInfo, setRecorderInfo] = useState<any>(null)

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

      // Fetch automations
      const automationsResponse = await apiClient.getHomeAssistantAutomations()
      if (automationsResponse.success && automationsResponse.data) {
        setAutomations(automationsResponse.data)
      }

      // Fetch addons
      const addonsResponse = await apiClient.getHomeAssistantAddons()
      if (addonsResponse.success && addonsResponse.data) {
        setAddons(addonsResponse.data)
      }

      // Fetch recorder info
      const recorderResponse = await apiClient.getHomeAssistantRecorderInfo()
      if (recorderResponse.success && recorderResponse.data) {
        setRecorderInfo(recorderResponse.data)
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

  const toggleAutomation = async (automationId: string, enable: boolean) => {
    try {
      setLoading(true)
      const response = enable 
        ? await apiClient.enableHomeAssistantAutomation(automationId)
        : await apiClient.disableHomeAssistantAutomation(automationId)
      
      if (response.success) {
        // Update local state
        setAutomations(prev => prev.map(automation => 
          automation.automation_id === automationId 
            ? { ...automation, enabled: enable } 
            : automation
        ))
        
        toast({
          title: "Success",
          description: `Automation ${enable ? 'enabled' : 'disabled'} successfully`
        })
      } else {
        throw new Error(response.error || `Failed to ${enable ? 'enable' : 'disable'} automation`)
      }
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} automation:`, error)
      toast({
        title: "Error",
        description: `Failed to ${enable ? 'enable' : 'disable'} automation`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerAutomation = async (automationId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.triggerHomeAssistantAutomation(automationId)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation triggered successfully"
        })
      } else {
        throw new Error(response.error || "Failed to trigger automation")
      }
    } catch (error) {
      console.error("Error triggering automation:", error)
      toast({
        title: "Error",
        description: "Failed to trigger automation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleAddon = async (addonId: string, enable: boolean) => {
    try {
      setLoading(true)
      const response = enable 
        ? await apiClient.enableHomeAssistantAddon(addonId)
        : await apiClient.disableHomeAssistantAddon(addonId)
      
      if (response.success) {
        // Update local state
        setAddons(prev => prev.map(addon => 
          addon.addon_id === addonId 
            ? { ...addon, enabled: enable } 
            : addon
        ))
        
        toast({
          title: "Success",
          description: `Addon ${enable ? 'enabled' : 'disabled'} successfully`
        })
      } else {
        throw new Error(response.error || `Failed to ${enable ? 'enable' : 'disable'} addon`)
      }
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} addon:`, error)
      toast({
        title: "Error",
        description: `Failed to ${enable ? 'enable' : 'disable'} addon`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold">Home Assistant Dashboard</h1>
          <p className="text-muted-foreground">Manage your smart home ecosystem</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All Data
        </Button>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Entities</p>
                <p className="text-2xl font-bold">{entities.length}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Devices</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Areas</p>
                <p className="text-2xl font-bold">{areas.length}</p>
              </div>
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          
          {recorderInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Recorder Status</h3>
              <div className="flex items-center gap-4 text-sm">
                <span>Run ID: {recorderInfo.run_id}</span>
                <span>Started: {new Date(recorderInfo.start).toLocaleString()}</span>
                <span>Status: {recorderInfo.end ? "Stopped" : "Running"}</span>
                <span>Incorrectly Closed: {recorderInfo.closed_incorrect ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>
        
        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
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
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
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
        </TabsContent>
        
        {/* Areas Tab */}
        <TabsContent value="areas" className="space-y-4">
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
        </TabsContent>
        
        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automations</CardTitle>
              <CardDescription>Manage your Home Assistant automations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.automation_id}>
                      <TableCell className="font-medium">{automation.name}</TableCell>
                      <TableCell>{automation.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={automation.enabled ? "default" : "secondary"}>
                          {automation.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {automation.last_triggered 
                          ? new Date(automation.last_triggered).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={(checked) => 
                              toggleAutomation(automation.automation_id, checked)
                            }
                            disabled={loading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerAutomation(automation.automation_id)}
                            disabled={loading || !automation.enabled}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Add-ons Tab */}
        <TabsContent value="addons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add-ons</CardTitle>
              <CardDescription>Manage your Home Assistant add-ons</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon.addon_id}>
                      <TableCell className="font-medium">{addon.name}</TableCell>
                      <TableCell>{addon.description || "—"}</TableCell>
                      <TableCell>{addon.version}</TableCell>
                      <TableCell>
                        <Badge variant={addon.enabled ? "default" : "secondary"}>
                          {addon.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={addon.enabled}
                          onCheckedChange={(checked) => 
                            toggleAddon(addon.addon_id, checked)
                          }
                          disabled={loading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}