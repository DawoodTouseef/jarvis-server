"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export function HomeAssistantTest() {
  const [entities, setEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testHomeAssistantAPI = async () => {
    setLoading(true)
    try {
      // Test getting entities
      const entitiesResponse = await apiClient.getHomeAssistantEntities()
      
      if (entitiesResponse.success) {
        setEntities(entitiesResponse.data || [])
        toast({
          title: "Success",
          description: `Found ${entitiesResponse.data?.length || 0} entities`
        })
      } else {
        toast({
          title: "Error",
          description: entitiesResponse.error || "Failed to fetch entities",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error testing Home Assistant API:", error)
      toast({
        title: "Error",
        description: "Failed to test Home Assistant API",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Home Assistant API Test</h3>
      <Button onClick={testHomeAssistantAPI} disabled={loading}>
        {loading ? "Testing..." : "Test Home Assistant API"}
      </Button>
      
      {entities.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Entities Found:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {entities.map((entity, index) => (
              <li key={index} className="text-sm">
                {entity.entity_id} - {entity.state}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}