"use client"

import { useState, useEffect, useRef } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { MapPin, Save, RefreshCw } from "lucide-react"
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

interface HomeLocation {
  latitude: number
  longitude: number
  elevation?: number
  unit_system?: string
  time_zone?: string
  location_name?: string
}

export function HomeAssistantLocationManager() {
  const [location, setLocation] = useState<HomeLocation>({
    latitude: 0,
    longitude: 0,
    elevation: 0,
    unit_system: "metric",
    time_zone: "UTC",
    location_name: "Home"
  })
  const [loading, setLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0])
  const mapRef = useRef<any>(null)

  // Fetch location data on component mount
  useEffect(() => {
    fetchLocation()
  }, [])

  const fetchLocation = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getHomeAssistantLocation()
      if (response.success && response.data) {
        setLocation(response.data)
        setMapCenter([response.data.latitude, response.data.longitude])
      }
    } catch (error) {
      console.error("Error fetching location:", error)
      toast({
        title: "Error",
        description: "Failed to fetch home location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!location.location_name || !location.latitude || !location.longitude) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.updateHomeAssistantLocation(location)
      
      if (response.success && response.data) {
        setLocation(response.data)
        setMapCenter([response.data.latitude, response.data.longitude])
        toast({
          title: "Success",
          description: "Home location updated successfully"
        })
      }
    } catch (error) {
      console.error("Error saving location:", error)
      toast({
        title: "Error",
        description: "Failed to save home location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng
    setLocation({
      ...location,
      latitude: lat,
      longitude: lng
    })
  }

  const handleMapReady = () => {
    if (mapRef.current) {
      mapRef.current.on('click', handleMapClick);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Home Location</h2>
          <p className="text-muted-foreground">Manage your home location and coordinates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLocation} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Location
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Form */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>Set your home coordinates and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name *</Label>
              <Input
                id="location-name"
                value={location.location_name || ""}
                onChange={(e) => setLocation({...location, location_name: e.target.value})}
                placeholder="e.g., Home, Office"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={location.latitude}
                  onChange={(e) => setLocation({...location, latitude: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 40.7128"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={location.longitude}
                  onChange={(e) => setLocation({...location, longitude: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="elevation">Elevation (meters)</Label>
              <Input
                id="elevation"
                type="number"
                step="any"
                value={location.elevation || 0}
                onChange={(e) => setLocation({...location, elevation: parseFloat(e.target.value) || 0})}
                placeholder="e.g., 10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-system">Unit System</Label>
                <select
                  id="unit-system"
                  className="w-full p-2 border rounded-md bg-background"
                  value={location.unit_system || "metric"}
                  onChange={(e) => setLocation({...location, unit_system: e.target.value})}
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time-zone">Time Zone</Label>
                <Input
                  id="time-zone"
                  value={location.time_zone || "UTC"}
                  onChange={(e) => setLocation({...location, time_zone: e.target.value})}
                  placeholder="e.g., America/New_York"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Location Map</CardTitle>
            <CardDescription>Click on the map to set your home location</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {typeof window !== 'undefined' && (
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                className="h-full w-full rounded-lg"
                ref={mapRef}
                whenReady={handleMapReady}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{location.location_name || "Home"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}