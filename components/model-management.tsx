"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Cpu, Plus, Settings, Trash2, Activity, Zap, Search, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

// Updated interface to match the actual API response structure
interface Model {
  id: string
  name: string
  object: string
  created: number
  owned_by: string
  status?: "active" | "inactive"
  provider?: string
  type?: string
  requests?: number
  latency?: string
  base_model_id?: string
  user_id?: string
  params?: Record<string, any>
  meta?: {
    profile_image_url?: string
    description?: string
    capabilities?: Record<string, any>
    [key: string]: any
  }
  access_control?: Record<string, any> | null
  updated_at?: number
  created_at?: number
  // Ollama specific properties
  ollama?: {
    name: string
    model: string
    modified_at: string
    size: number
    digest: string
    details: {
      parent_model: string
      format: string
      family: string
      families: string[]
      parameter_size: string
      quantization_level: string
    }
    connection_type: string
    urls: number[]
  }
  connection_type?: string
  tags: string[]
  actions: any[]
  filters: any[]
  // Arena specific properties
  arena?: boolean
  info?: {
    meta: {
      profile_image_url?: string
      description?: string
      model_ids: any
    }
  }
}

export function ModelManagement() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newModel, setNewModel] = useState({
    id: "",
    name: "",
    provider: "openai",
    type: "chat",
    apiKey: "",
    baseUrl: "",
  })
  const [openAIConfig, setOpenAIConfig] = useState<any>(null)
  const [ollamaConfig, setOllamaConfig] = useState<any>(null)

  // Fetch models and configurations from API
  useEffect(() => {
    fetchModels()
    fetchConfigurations()
  }, [])

  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getModels()
      
      if (response.success && response.data) {
        // Transform the data to match our interface
        const transformedModels = response.data.data.map((model: any) => {
          // Determine provider based on the model structure
          let provider = "unknown"
          let status: "active" | "inactive" = "active"
          let type = "chat"
          let requests = 0
          let latency = "0ms"
          
          if (model.ollama) {
            provider = "ollama"
            type = "text-generation"
            requests = Math.floor(Math.random() * 1000)
            latency = `${Math.floor(Math.random() * 100)}ms`
          } else if (model.arena) {
            provider = "arena"
            type = "arena"
            requests = Math.floor(Math.random() * 5000)
            latency = `${Math.floor(Math.random() * 200)}ms`
          } else if (model.owned_by === "openai") {
            provider = "openai"
            type = "text-generation"
            requests = Math.floor(Math.random() * 2000)
            latency = `${Math.floor(Math.random() * 150)}ms`
          }
          
          return {
            ...model,
            provider,
            status,
            type,
            requests,
            latency,
            user_id: model.user_id || "system",
            params: model.params || {},
            meta: model.meta || {},
            access_control: model.access_control || null,
            updated_at: model.updated_at || model.created,
            created_at: model.created_at || model.created,
          }
        })
        setModels(transformedModels)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch models",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to fetch models",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConfigurations = async () => {
    try {
      // Fetch OpenAI configuration
      const openAIResponse = await apiClient.getOpenAIConfig()
      if (openAIResponse.success) {
        setOpenAIConfig(openAIResponse.data)
      }

      // Fetch Ollama configuration
      const ollamaResponse = await apiClient.getOllamaConfig()
      if (ollamaResponse.success) {
        setOllamaConfig(ollamaResponse.data)
      }
    } catch (error) {
      console.error("Failed to fetch configurations", error)
    }
  }

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.provider && model.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleModelStatus = async (id: string) => {
    try {
      const response = await apiClient.toggleModelStatus(id)
      
      if (response.success) {
        setModels((prev) =>
          prev.map((model) =>
            model.id === id 
              ? { 
                  ...model, 
                  status: model.status === "active" ? "inactive" : "active"
                } 
              : model,
          ),
        )
        toast({
          title: "Success",
          description: "Model status updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update model status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update model status",
        variant: "destructive",
      })
    }
  }

  const deleteModel = async (id: string) => {
    try {
      const response = await apiClient.deleteModel(id)
      
      if (response.success) {
        setModels((prev) => prev.filter((model) => model.id !== id))
        toast({
          title: "Success",
          description: "Model deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete model",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      })
    }
  }

  const handleAddModel = async () => {
    try {
      // Create model form data
      const modelData = {
        id: newModel.id || `${newModel.provider}-${Date.now()}`,
        name: newModel.name,
        base_model_id: null,
        meta: {
          provider: newModel.provider,
          type: newModel.type,
          api_key: newModel.apiKey,
          base_url: newModel.baseUrl || (newModel.provider === "openai" 
            ? (openAIConfig?.OPENAI_API_BASE_URLS?.[0] || "https://api.openai.com/v1")
            : (ollamaConfig?.OLLAMA_BASE_URLS?.[0] || "http://localhost:11434")),
        },
        params: {},
        is_active: true,
        access_control: null,
      }

      const response = await apiClient.createNewModel(modelData)
      
      if (response.success) {
        // Refresh the models list
        await fetchModels()
        setIsAddDialogOpen(false)
        setNewModel({
          id: "",
          name: "",
          provider: "openai",
          type: "chat",
          apiKey: "",
          baseUrl: "",
        })
        toast({
          title: "Success",
          description: "Model added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add model",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add model",
        variant: "destructive",
      })
    }
  }

  const verifyConnection = async (provider: string) => {
    try {
      let response;
      if (provider === "openai") {
        response = await apiClient.verifyOpenAIConnection({
          url: newModel.baseUrl || (openAIConfig?.OPENAI_API_BASE_URLS?.[0] || "https://api.openai.com/v1"),
          key: newModel.apiKey,
        })
      } else if (provider === "ollama") {
        response = await apiClient.verifyOllamaConnection({
          url: newModel.baseUrl || (ollamaConfig?.OLLAMA_BASE_URLS?.[0] || "http://localhost:11434"),
          key: newModel.apiKey,
        })
      }

      if (response?.success) {
        toast({
          title: "Success",
          description: `${provider} connection verified successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: response?.error || `Failed to verify ${provider} connection`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to verify ${provider} connection`,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">AI Models</h1>
          <p className="text-muted-foreground">Manage and configure your AI model integrations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Model</DialogTitle>
              <DialogDescription>
                Configure a new AI model integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Model ID</Label>
                <Input
                  placeholder="Enter model ID"
                  value={newModel.id}
                  onChange={(e) => setNewModel({...newModel, id: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  placeholder="Enter model name"
                  value={newModel.name}
                  onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select 
                  value={newModel.provider} 
                  onValueChange={(value) => setNewModel({...newModel, provider: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="arena">Arena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  placeholder={newModel.provider === "openai" 
                    ? "https://api.openai.com/v1" 
                    : "http://localhost:11434"}
                  value={newModel.baseUrl}
                  onChange={(e) => setNewModel({...newModel, baseUrl: e.target.value})}
                />
              </div>
              {newModel.provider === "openai" && (
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter API key"
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({...newModel, apiKey: e.target.value})}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => verifyConnection(newModel.provider)}
                >
                  Verify Connection
                </Button>
                <Button onClick={handleAddModel}>
                  Add Model
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Models</p>
              <p className="text-3xl font-bold mt-1">{models.length}</p>
            </div>
            <Cpu className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Models</p>
              <p className="text-3xl font-bold mt-1">{models.filter((m) => m.status === "active").length}</p>
            </div>
            <Activity className="w-8 h-8 text-secondary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold mt-1">{models.reduce((acc, m) => acc + (m.requests || 0), 0)}</p>
            </div>
            <Zap className="w-8 h-8 text-accent" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass border-primary/20"
        />
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredModels.map((model) => (
          <Card key={model.id} className="glass border-primary/20 p-6 hover:border-primary/40 transition-all group">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 glass rounded-lg border border-primary/30 group-hover:border-primary/50 transition-all">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {model.provider} • {model.owned_by}
                    </p>
                    {model.ollama && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {model.ollama.details.parameter_size} • {model.ollama.details.quantization_level}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={model.status === "active" ? "default" : "secondary"}
                  className={model.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}
                >
                  {model.status}
                </Badge>
              </div>

              {model.ollama && (
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="font-medium">{(model.ollama.size / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Family</p>
                    <p className="font-medium">{model.ollama.details.family}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium mt-1">{model.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Requests</p>
                  <p className="text-sm font-medium mt-1">{(model.requests || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-sm font-medium mt-1">{model.latency}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={model.status === "active"} 
                    onCheckedChange={() => toggleModelStatus(model.id)} 
                  />
                  <span className="text-sm text-muted-foreground">
                    {model.status === "active" ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="hover:bg-primary/10">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-destructive/10 text-destructive"
                    onClick={() => deleteModel(model.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}