"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Play, Pause, Square, Power, Volume2, Thermometer, Lock, Unlock } from "lucide-react"

export function HomeAssistantServiceTest() {
  const [loading, setLoading] = useState(false)
  const [entityId, setEntityId] = useState("light.living_room")
  const [domain, setDomain] = useState("light")
  const [service, setService] = useState("turn_on")
  const [serviceData, setServiceData] = useState("")

  const domainServices: Record<string, string[]> = {
    light: ["turn_on", "turn_off", "toggle"],
    cover: ["open_cover", "close_cover", "stop_cover", "set_cover_position"],
    media_player: ["media_play", "media_pause", "media_stop", "volume_set", "volume_mute"],
    climate: ["set_temperature", "set_hvac_mode", "set_fan_mode", "set_preset_mode"],
    lock: ["lock", "unlock"],
    scene: ["turn_on"],
    script: ["turn_on"],
    automation: ["turn_on", "turn_off", "trigger"],
    homeassistant: ["turn_on", "turn_off", "toggle", "start", "stop", "pause", "resume", "set_location"]
  }

  const handleTestService = async () => {
    if (!entityId) {
      toast({
        title: "Error",
        description: "Please enter an entity ID",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      // Parse service data if provided
      let parsedData = {}
      if (serviceData) {
        try {
          parsedData = JSON.parse(serviceData)
        } catch (e) {
          toast({
            title: "Error",
            description: "Invalid JSON in service data",
            variant: "destructive"
          })
          return
        }
      }
      
      // Add entity_id to service data
      parsedData = { ...parsedData, entity_id: entityId }
      
      const response = await apiClient.callHomeAssistantService(domain, service, parsedData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Service ${domain}.${service} called successfully`
        })
      } else {
        toast({
          title: "Error",
          description: response.error || `Failed to call service ${domain}.${service}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error testing service:", error)
      toast({
        title: "Error",
        description: "Failed to test service",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickTest = async (testDomain: string, testService: string, testEntityId: string, testData?: any) => {
    try {
      setLoading(true)
      const data = { ...testData, entity_id: testEntityId }
      const response = await apiClient.callHomeAssistantService(testDomain, testService, data)
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Quick test ${testDomain}.${testService} completed`
        })
      } else {
        toast({
          title: "Error",
          description: response.error || `Quick test failed`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error in quick test:", error)
      toast({
        title: "Error",
        description: "Quick test failed",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Testing</h2>
          <p className="text-muted-foreground">Test Home Assistant services and commands</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Call Form */}
        <Card>
          <CardHeader>
            <CardTitle>Service Call</CardTitle>
            <CardDescription>Manually call any Home Assistant service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(domainServices).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainServices[domain]?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entity-id">Entity ID</Label>
              <Input
                id="entity-id"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="e.g., light.living_room"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-data">Service Data (JSON)</Label>
              <Input
                id="service-data"
                value={serviceData}
                onChange={(e) => setServiceData(e.target.value)}
                placeholder='e.g., {"brightness": 128}'
              />
            </div>
            
            <Button onClick={handleTestService} disabled={loading} className="w-full">
              {loading ? "Calling Service..." : "Call Service"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
            <CardDescription>Common service tests with one click</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleQuickTest("light", "turn_on", "light.living_room", {brightness: 128})}
                disabled={loading}
                variant="outline"
              >
                <Power className="w-4 h-4 mr-2" />
                Light On
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("light", "turn_off", "light.living_room")}
                disabled={loading}
                variant="outline"
              >
                <Power className="w-4 h-4 mr-2" />
                Light Off
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("media_player", "media_play", "media_player.living_room")}
                disabled={loading}
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Media
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("media_player", "media_pause", "media_player.living_room")}
                disabled={loading}
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Media
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("media_player", "media_stop", "media_player.living_room")}
                disabled={loading}
                variant="outline"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Media
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("media_player", "volume_set", "media_player.living_room", {volume_level: 0.5})}
                disabled={loading}
                variant="outline"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Set Volume
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("climate", "set_temperature", "climate.living_room", {temperature: 22})}
                disabled={loading}
                variant="outline"
              >
                <Thermometer className="w-4 h-4 mr-2" />
                Set Temp
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("lock", "lock", "lock.front_door")}
                disabled={loading}
                variant="outline"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Door
              </Button>
              
              <Button 
                onClick={() => handleQuickTest("lock", "unlock", "lock.front_door")}
                disabled={loading}
                variant="outline"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Door
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}