"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Cpu, Plus, Settings, Trash2, Activity, Zap, Search, Loader2, Edit } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { ModelEditForm } from "@/components/model-edit-form"
import { ModelAddForm } from "@/components/model-add-form"
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
  is_active?: boolean
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
  const [isOllamaDialogOpen, setIsOllamaDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [newModel, setNewModel] = useState({
    id: "",
    base_model_id: "",
    name: "",
    meta: {
      profile_image_url: "",
      description: "",
      capabilities: {}
    },
    params: {},
    access_control: null,
    is_active: true,
  })

   
  const [openAIConfig, setOpenAIConfig] = useState<any>(null)
  const [ollamaConfig, setOllamaConfig] = useState<any>(null)
  const [ollamaInstances, setOllamaInstances] = useState<string[]>([])
  const [selectedOllamaInstance, setSelectedOllamaInstance] = useState<number>(0)
  const [ollamaModelTag, setOllamaModelTag] = useState("")
  const [ollamaModels, setOllamaModels] = useState<any[]>([])
  const [selectedOllamaModelToDelete, setSelectedOllamaModelToDelete] = useState("")
  const [ollamaCreateModelTag, setOllamaCreateModelTag] = useState("")
  const [ollamaCreateModelContent, setOllamaCreateModelContent] = useState("")
  const [showmodelmeta, setshowModelmeta] = useState<boolean>(false)
  const [modelimage, setmodelimage] = useState<"upload" | "url">("upload")
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
        // Check if response.data is an array directly or has a data property
        const modelsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || response.data;
        
        if (Array.isArray(modelsData)) {
          // Transform the data to match our interface
          const transformedModels = modelsData.map((model: any) => {
            // Determine provider based on the model structure
            let provider = "unknown"
            let status: "active" | "inactive" = "active"
            let type = "chat"
            let requests = 0
            let latency = "0ms"
            
            if (model.ollama) {
              provider = "ollama"
              type = "text-generation"
              // Use model-specific data if available, otherwise default values
              requests = model.requests || model.ollama.requests || 0
              latency = model.latency || model.ollama.latency || "0ms"
            } else if (model.arena) {
              provider = "arena"
              type = "arena"
              requests = model.requests || 0
              latency = model.latency || "0ms"
            } else if (model.owned_by === "openai") {
              provider = "openai"
              type = "text-generation"
              requests = model.requests || 0
              latency = model.latency || "0ms"
            }
            
            return {
              ...model,
              provider,
              status,
              type,
              requests,
              latency,
            }
          })
          
          setModels(transformedModels)
        }
      }
    } catch (error) {
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
        if (ollamaResponse.data.OLLAMA_BASE_URLS) {
          setOllamaInstances(ollamaResponse.data.OLLAMA_BASE_URLS)
        }
      }
    } catch (error) {
      console.error("Failed to fetch configurations", error)
    }
  }

  const fetchOllamaModels = async (urlIdx: number) => {
    try {
      const response = await apiClient.getOllamaModels(urlIdx)
      if (response.success && response.data) {
        setOllamaModels(response.data.models || [])
      }
    } catch (error) {
      console.error("Failed to fetch Ollama models", error)
      toast({
        title: "Error",
        description: "Failed to fetch Ollama models",
        variant: "destructive",
      })
    }
  }

  let filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.provider && model.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  useEffect(() => {
    filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.provider && model.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  }, [searchQuery])
  const toggleModelStatus = async (id: string) => {
    try {
      const response = await apiClient.toggleModelStatus(id)
      console.log(response)
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


  

  const handleEditModel = (model: Model) => {
    setEditingModel(model)
  }

  const handleSaveEditedModel = (updatedModel: Model) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === updatedModel.id ? updatedModel : model
      )
    )
    setEditingModel(null)
    fetchModels()
    toast({
      title: "Success",
      description: "Model updated successfully",
    })
  }

  const handleCancelEdit = () => {
    setEditingModel(null)
  }

  const handleAddModel = () => {
    setIsAddDialogOpen(false)
    fetchModels()
    toast({
      title: "Success",
      description: "Model created successfully",
    })
  }

  // When Ollama instance changes, fetch models for that instance
  useEffect(() => {
    if (isOllamaDialogOpen && ollamaInstances.length > 0) {
      fetchOllamaModels(selectedOllamaInstance)
    }
  }, [selectedOllamaInstance, isOllamaDialogOpen, ollamaInstances.length])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // If we're editing a model, show the edit form
  if (editingModel) {
    return (
      <ModelEditForm 
        model={editingModel} 
        onSave={handleSaveEditedModel} 
        onCancel={handleCancelEdit} 
      />
    )
  }
  if (isAddDialogOpen) return (
    <ModelAddForm 
      models={models}
      onSave={handleSaveEditedModel}
      onCancel={handleAddModel}
    />
  )
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">AI Models</h1>
          <p className="text-muted-foreground">Manage and configure your AI model integrations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>
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
                  
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="hover:bg-primary/10"
                    onClick={() => handleEditModel(model)}
                  >
                    <Edit className="w-4 h-4" />
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