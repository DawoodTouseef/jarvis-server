"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Activity, 
  RefreshCw, 
  Play,
  Pause,
  Move,
  Lock,
  Volume2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

interface EntityState {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

export function HomeAssistantMapDeviceControl() {
  const [entities, setEntities] = useState<EntityState[]>([])
  const [deviceLocations, setDeviceLocations] = useState<{[key: string]: [number, number]}>({})
  const [loading, setLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.898360, 77.617950])
  const [L, setL] = useState<any>(null)
  const mapRef = useRef<any>(null)

  // Load Leaflet library dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        // Load CSS files first
        const leafletCss = document.createElement('link')
        leafletCss.rel = 'stylesheet'
        leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(leafletCss)
        
        const compatibilityCss = document.createElement('link')
        compatibilityCss.rel = 'stylesheet'
        compatibilityCss.href = 'https://cdn.jsdelivr.net/npm/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.css'
        document.head.appendChild(compatibilityCss)
        
        // Load Leaflet library
        const leafletModule = await import('leaflet')
        setL(() => leafletModule.default)
      }
    }
    
    loadLeaflet()
  }, [])

  // Fetch entities and their locations
  useEffect(() => {
    fetchData()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
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
        
        // Extract device locations from entities
        const locations: {[key: string]: [number, number]} = {}
        entityStates.forEach(entity => {
          // Check if entity has latitude and longitude attributes
          if (entity.attributes.latitude && entity.attributes.longitude) {
            locations[entity.entity_id] = [
              entity.attributes.latitude,
              entity.attributes.longitude
            ]
          }
        })
        setDeviceLocations(locations)
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

  const getEntityIcon = (entity: EntityState) => {
    if (!L) return null
    
    const domain = entity.entity_id.split(".")[0]
    const isOn = entity.state === "on" || entity.state === "home" || entity.state === "playing" || entity.state === "open"
    
    let iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
    
    if (isOn) {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
    } else if (entity.state === "off" || entity.state === "not_home" || entity.state === "closed" || entity.state === "locked") {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
    }
    
    return new L.Icon({
      iconUrl,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }

  const getEntityDomain = (entityId: string) => {
    return entityId.split(".")[0]
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
          </div>
        )
      default:
        return (
          <Badge variant={entity.state === "on" || entity.state === "home" ? "default" : "secondary"}>
            {entity.state}
          </Badge>
        )
    }
  }

  const getEntityIconComponent = (domain: string, state: string) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Map & Device Control</h2>
          <p className="text-muted-foreground">Control your smart home devices on the map</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Device Locations</CardTitle>
          <CardDescription>View and control your devices on the map</CardDescription>
        </CardHeader>
        <CardContent className="h-full p-0">
          {typeof window !== 'undefined' && L && MapContainer && TileLayer && Marker && Popup ? (
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              className="h-full w-full rounded-lg"
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {Object.entries(deviceLocations).map(([entityId, position]) => {
                const entity = entities.find(e => e.entity_id === entityId)
                if (!entity) return null
                
                const domain = getEntityDomain(entityId)
                
                return (
                  <Marker 
                    key={entityId} 
                    position={position} 
                    icon={getEntityIcon(entity)}
                  >
                    <Popup>
                      <div className="min-w-64">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            {getEntityIconComponent(domain, entity.state)}
                            {entity.attributes.friendly_name || entityId}
                          </h3>
                          <Badge variant={entity.state === "on" || entity.state === "home" ? "default" : "secondary"}>
                            {entity.state}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {domain}
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                          <span className="font-medium">Last changed:</span>
                          <span>{new Date(entity.last_changed).toLocaleTimeString()}</span>
                          <span className="font-medium">Last updated:</span>
                          <span>{new Date(entity.last_updated).toLocaleTimeString()}</span>
                        </div>
                        {entity.attributes.battery_level && (
                          <div className="mb-3">
                            <span className="text-xs">Battery: {entity.attributes.battery_level}%</span>
                          </div>
                        )}
                        <div className="mt-2">
                          {renderEntityControl(entity)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entities List */}
      <Card>
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
          <CardDescription>Control your devices from the list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => {
              const domain = getEntityDomain(entity.entity_id)
              const hasLocation = deviceLocations[entity.entity_id] !== undefined
              
              return (
                <Card key={entity.entity_id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getEntityIconComponent(domain, entity.state)}
                      <div>
                        <h4 className="font-medium">{entity.attributes.friendly_name || entity.entity_id.split(".")[1]}</h4>
                        <p className="text-xs text-muted-foreground">{entity.entity_id}</p>
                      </div>
                    </div>
                    <Badge variant={entity.state === "on" || entity.state === "home" ? "default" : "secondary"}>
                      {entity.state}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <Badge variant="secondary">{domain}</Badge>
                    {hasLocation && (
                      <Badge variant="outline">📍</Badge>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    {renderEntityControl(entity)}
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}