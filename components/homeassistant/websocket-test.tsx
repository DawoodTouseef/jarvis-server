"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Play, Pause, Square, Power, Volume2, Thermometer, Lock, Unlock, Wifi, WifiOff } from "lucide-react"

export function HomeAssistantWebSocketTest() {
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [messages, setMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const websocketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const connectWebSocket = () => {
    if (connectionStatus !== "disconnected") return

    setConnectionStatus("connecting")
    setMessages(prev => [...prev, "Connecting to WebSocket..."])

    try {
      // Get token from localStorage or other auth mechanism
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Create WebSocket connection
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
      websocketRef.current = new WebSocket(wsUrl)
      
      // Set up event handlers
      websocketRef.current.onopen = () => {
        setConnectionStatus("connected")
        setMessages(prev => [...prev, "Connected to Home Assistant WebSocket"])
        toast({
          title: "Connected",
          description: "WebSocket connection established"
        })
      }

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setMessages(prev => [...prev, `← ${JSON.stringify(data)}`])
        } catch (e) {
          setMessages(prev => [...prev, `← ${event.data}`])
        }
      }

      websocketRef.current.onerror = (error) => {
        setConnectionStatus("disconnected")
        setMessages(prev => [...prev, `Error: ${error.message}`])
        toast({
          title: "Connection Error",
          description: "WebSocket connection failed",
          variant: "destructive"
        })
      }

      websocketRef.current.onclose = (event) => {
        setConnectionStatus("disconnected")
        setMessages(prev => [...prev, `Disconnected: ${event.reason || 'Connection closed'}`])
        toast({
          title: "Disconnected",
          description: "WebSocket connection closed"
        })
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      setMessages(prev => [...prev, `Connection failed: ${error.message}`])
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
    setConnectionStatus("disconnected")
    setMessages(prev => [...prev, "Disconnected by user"])
  }

  const sendMessage = () => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "WebSocket is not connected",
        variant: "destructive"
      })
      return
    }

    if (!inputMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      })
      return
    }

    try {
      websocketRef.current.send(inputMessage)
      setMessages(prev => [...prev, `→ ${inputMessage}`])
      setInputMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  const sendJsonMessage = (jsonData: any) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "WebSocket is not connected",
        variant: "destructive"
      })
      return
    }

    try {
      const message = JSON.stringify(jsonData)
      websocketRef.current.send(message)
      setMessages(prev => [...prev, `→ ${message}`])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">WebSocket Testing</h2>
          <p className="text-muted-foreground">Test real-time communication with Home Assistant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Control */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Connection</CardTitle>
            <CardDescription>Manage your WebSocket connection to Home Assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" : 
                connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
              }`}></div>
              <span className="font-medium">
                {connectionStatus === "connected" ? "Connected" : 
                 connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={connectWebSocket} 
                disabled={connectionStatus !== "disconnected"}
                className="flex-1"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Connect
              </Button>
              
              <Button 
                onClick={disconnectWebSocket} 
                disabled={connectionStatus === "disconnected"}
                variant="destructive"
                className="flex-1"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Quick Commands</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => sendJsonMessage({type: "subscribe_events", event_type: "state_changed"})}
                  disabled={connectionStatus !== "connected"}
                  size="sm"
                  variant="outline"
                >
                  Subscribe States
                </Button>
                
                <Button 
                  onClick={() => sendJsonMessage({type: "subscribe_events", event_type: "*"})}
                  disabled={connectionStatus !== "connected"}
                  size="sm"
                  variant="outline"
                >
                  Subscribe All
                </Button>
                
                <Button 
                  onClick={() => sendJsonMessage({type: "unsubscribe_events", event_type: "state_changed"})}
                  disabled={connectionStatus !== "connected"}
                  size="sm"
                  variant="outline"
                >
                  Unsubscribe States
                </Button>
                
                <Button 
                  onClick={() => sendJsonMessage({type: "unsubscribe_events", event_type: "*"})}
                  disabled={connectionStatus !== "connected"}
                  size="sm"
                  variant="outline"
                >
                  Unsubscribe All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Message Exchange</CardTitle>
            <CardDescription>Send and receive WebSocket messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-3 h-64 overflow-y-auto bg-muted">
              {messages.map((msg, index) => (
                <div key={index} className="text-sm font-mono break-words mb-1">
                  {msg}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-input">Send Message</Label>
              <div className="flex gap-2">
                <Input
                  id="message-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter message or JSON"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={connectionStatus !== "connected"}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}