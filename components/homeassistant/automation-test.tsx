"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Play, Pause, Square, Power, Volume2, Thermometer, Lock, Unlock, Plus, Trash2 } from "lucide-react"

export function HomeAssistantAutomationTest() {
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newAutomation, setNewAutomation] = useState({
    automation_id: "",
    name: "",
    description: "",
    enabled: true,
    trigger: [] as any[],
    condition: [] as any[],
    action: [] as any[]
  })

  const fetchAutomations = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getHomeAssistantAutomations()
      if (response.success) {
        setAutomations(response.data || [])
      }
    } catch (error) {
      console.error("Error fetching automations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch automations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAutomations()
  }, [])

  const handleCreateAutomation = async () => {
    if (!newAutomation.automation_id || !newAutomation.name) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.createHomeAssistantAutomation(newAutomation)
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation created successfully"
        })
        fetchAutomations()
        // Reset form
        setNewAutomation({
          automation_id: "",
          name: "",
          description: "",
          enabled: true,
          trigger: [],
          condition: [],
          action: []
        })
      } else {
        throw new Error(response.error || "Unknown error")
      }
    } catch (error: any) {
      console.error("Error creating automation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create automation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerAutomation = async (automationId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.triggerHomeAssistantAutomation(automationId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation triggered successfully"
        })
      } else {
        throw new Error(response.error || "Unknown error")
      }
    } catch (error: any) {
      console.error("Error triggering automation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to trigger automation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnableAutomation = async (automationId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.enableHomeAssistantAutomation(automationId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation enabled successfully"
        })
        fetchAutomations()
      } else {
        throw new Error(response.error || "Unknown error")
      }
    } catch (error: any) {
      console.error("Error enabling automation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to enable automation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisableAutomation = async (automationId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.disableHomeAssistantAutomation(automationId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation disabled successfully"
        })
        fetchAutomations()
      } else {
        throw new Error(response.error || "Unknown error")
      }
    } catch (error: any) {
      console.error("Error disabling automation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to disable automation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.deleteHomeAssistantAutomation(automationId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Automation deleted successfully"
        })
        fetchAutomations()
      } else {
        throw new Error(response.error || "Unknown error")
      }
    } catch (error: any) {
      console.error("Error deleting automation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete automation",
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
          <h2 className="text-2xl font-bold">Automation Testing</h2>
          <p className="text-muted-foreground">Test advanced Home Assistant automations</p>
        </div>
        <Button onClick={fetchAutomations} disabled={loading} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Automations</CardTitle>
            <CardDescription>Manage your Home Assistant automations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {automations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No automations found</p>
            ) : (
              <div className="space-y-3">
                {automations.map((automation) => (
                  <div key={automation.automation_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">{automation.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            automation.enabled 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {automation.enabled ? "Enabled" : "Disabled"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {automation.trigger?.length || 0} triggers, 
                            {automation.condition?.length || 0} conditions, 
                            {automation.action?.length || 0} actions
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleTriggerAutomation(automation.automation_id)}
                          disabled={loading || !automation.enabled}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        {automation.enabled ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDisableAutomation(automation.automation_id)}
                            disabled={loading}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEnableAutomation(automation.automation_id)}
                            disabled={loading}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteAutomation(automation.automation_id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Automation */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Automation</CardTitle>
            <CardDescription>Define a new Home Assistant automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="automation-id">Automation ID *</Label>
              <Input
                id="automation-id"
                value={newAutomation.automation_id}
                onChange={(e) => setNewAutomation({...newAutomation, automation_id: e.target.value})}
                placeholder="e.g., motion_light_automation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="automation-name">Name *</Label>
              <Input
                id="automation-name"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({...newAutomation, name: e.target.value})}
                placeholder="e.g., Motion Light Automation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="automation-description">Description</Label>
              <Input
                id="automation-description"
                value={newAutomation.description}
                onChange={(e) => setNewAutomation({...newAutomation, description: e.target.value})}
                placeholder="e.g., Turn on light when motion is detected"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Example Triggers</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    trigger: [...newAutomation.trigger, {
                      platform: "state",
                      entity_id: "binary_sensor.motion_sensor",
                      to: "on"
                    }]
                  })}
                >
                  Motion Sensor
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    trigger: [...newAutomation.trigger, {
                      platform: "time",
                      at: "20:00:00"
                    }]
                  })}
                >
                  Time Trigger
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    trigger: [...newAutomation.trigger, {
                      platform: "numeric_state",
                      entity_id: "sensor.temperature",
                      above: 30
                    }]
                  })}
                >
                  Temp {">"} 30°C
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    trigger: [...newAutomation.trigger, {
                      platform: "sun",
                      sun_event: "sunset"
                    }]
                  })}
                >
                  Sunset
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Example Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    action: [...newAutomation.action, {
                      service: "light.turn_on",
                      entity_id: "light.living_room"
                    }]
                  })}
                >
                  Light On
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    action: [...newAutomation.action, {
                      service: "light.turn_off",
                      entity_id: "light.living_room"
                    }]
                  })}
                >
                  Light Off
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    action: [...newAutomation.action, {
                      delay: "5"
                    }]
                  })}
                >
                  5s Delay
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setNewAutomation({
                    ...newAutomation,
                    action: [...newAutomation.action, {
                      service: "notify.mobile_app",
                      service_data: {
                        message: "Motion detected!"
                      }
                    }]
                  })}
                >
                  Send Notification
                </Button>
              </div>
            </div>
            
            <Button onClick={handleCreateAutomation} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Automation"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}