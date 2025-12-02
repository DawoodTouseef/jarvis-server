"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  Upload, 
  Edit,
  FileText,
  Eye,
  Github,
  EyeOff
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, type Pipeline } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PipelineSystem() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [newPipeline, setNewPipeline] = useState({
    name: "",
    description: "",
    url: "",
  })
  const [manualUrl, setManualUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File[]>([])
  const [PIPELINE_LIST, setPIPELINE_LIST] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pipelineValue, setPipelineValue] = useState<any>(null)
  const [pipelineSpecs, setPipelineSpecs] = useState<any>(null)
  const [showValves, setShowValves] = useState<boolean>(false)
  const [showSpecs, setShowSpecs] = useState<boolean>(false)
  
  useEffect(() => {
    fetchPipelines()
    fetchPipelinesList()
    
  }, [])

  const fetchValue = async (id: string) => {
    try {
      const response = await apiClient.getPipelineValves(id)
      
      if (response.success && response.data) {
        setShowValves(!showValves)
        setPipelineValue(response.data)
        
      }
      else if (!response.success)
      {
        toast({
          title: "Error",
          description: typeof response.error === 'string' ? response.error : JSON.stringify(response.error) || "Failed to fetch pipeline valves",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast(
        {
          title:"Error",
          description:`${error}`,
          variant:"destructive"
        }
      )
    }
  }
  
  const fetchPipelines = async () => {
    try {
      const response = await apiClient.getPipelinesList()
      if (response.success && response.data) {
        setLoading(false)
        // Transform the pipeline data to match our frontend interface
        const transformedPipelines = Array.isArray(response.data) 
          ? response.data.map((pipeline: any) => ({ ...pipeline })) 
          : []
        setPipelines(transformedPipelines)
        
        // Fetch models for each pipeline
        transformedPipelines.forEach((pipeline: any) => fetchModels(pipeline.id))
      }
    } catch (error) {
      console.error("Failed to fetch pipelines", error)
      toast({
        title: "Error",
        description: "Failed to fetch pipelines",
        variant: "destructive",
      })
    }
  }
  
  const fetchModels = async (id: string) => {
    try {
      // Get the pipeline list to find the urlIdx for this pipeline
      const listResponse = await apiClient.getPipelinesList();
      if (listResponse.success && listResponse.data && listResponse.data.data) {
        const pipelineList = listResponse.data.data;
        // Find the urlIdx for the pipeline with the given id
        const pipelineInfo = pipelineList.find((p: any) => p.id === id);
        
        // Only fetch pipeline data if we have a valid urlIdx
        if (pipelineInfo && pipelineInfo.idx !== undefined) {
          const response = await apiClient.getPipelineById(id, pipelineInfo.idx);
          if (response.success && response.data) {
            console.log("Pipeline Data:", response.data);
            // The response data should contain the pipeline models directly
            if (Array.isArray(response.data)) {
              setModels(prev => [...prev, ...(Array.isArray(response.data) ? response.data : [response.data])]);
              
            } else if (response.data && typeof response.data === 'object') {
              // If it's a single object, add it to the array
              setModels(prev => [...prev, response.data]);
            }
          }
        }
      }
    } catch (error) {
      toast(
        {
          title:"Error",
          description:"Failed to fetch models",
          variant:"destructive"
        }
      )
    }
  };
  
  const fetchPipelinesList = async () => {
    try {
      const response = await apiClient.getPipelinesList()
      if (response.success && response.data) {
        setPIPELINE_LIST(response.data.data || [])
      }
    } catch (error) {
      toast(
        {
          title:"Error",
          description:"Failed to fetch models",
          variant:"destructive"
        }
      )
    }
  }

  const deletePipeline = async (id: string, urlIdx: number) => {
    try {
      const response = await apiClient.deletePipeline(id, urlIdx);
      if (response.success) {
        setModels((prev) => prev.filter((model) => model.id !== id));
        setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== id));
        toast({
          title: "Success",
          description: "Pipeline deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: typeof response.error === 'object' ? JSON.stringify(response.error) : response.error || "Failed to delete pipeline",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pipeline: " + (error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : "Unknown error"),
        variant: "destructive",
      });
    }
  }

  const createPipeline = async () => {
    try {
      // Use either the selected URL or the manually entered URL
      const pipelineUrl = newPipeline.url || manualUrl;
      
      if (!pipelineUrl && selectedFile.length === 0) {
        toast({
          title: "Error",
          description: "Please select a pipeline URL, enter a GitHub URL, or upload a file",
          variant: "destructive",
        });
        return;
      }
      
      // Find the urlIdx for the selected pipeline
      const selectedPipeline = PIPELINE_LIST.find((p: any) => p.url === pipelineUrl);
      const urlIdx = selectedPipeline ? selectedPipeline.idx : 0;
      
      let response;
      
      if (selectedFile && selectedFile.length > 0) {

        const file = selectedFile[0]; // Get the first file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('urlIdx', urlIdx.toString())
        
        response = await apiClient.createPipelineByFile(formData, urlIdx)
      } else if (pipelineUrl) {
        response = await apiClient.createPipelineByUrl(pipelineUrl, urlIdx)
      } else {
        toast({
          title: "Error",
          description: "Please provide either a file or a URL",
          variant: "destructive",
        });
        return;
      }
      
      
      if (response.success && response.data) {
        // Transform backend data to match frontend interface
        const transformedPipeline = {
          ...response.data,
        }
        
        setPipelines((prev) => [...prev, transformedPipeline])
        console.log(response.data)
        fetchModels(response.data.id)
        
        setIsCreateDialogOpen(false)
        setNewPipeline({
          name: "",
          description: "",
          url: "",
        })
        setManualUrl("")
        setSelectedFile([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        toast({
          title: "Success",
          description: "Pipeline created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: typeof response.error === 'object' ? JSON.stringify(response.error) : response.error || "Failed to create pipeline",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pipeline: " + (error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : "Unknown error"),
        variant: "destructive",
      })
    }
  }

  const updatePipeline = async () => {
    if (!editingPipeline) return
    
    try {
      const response = await apiClient.updatePipeline(editingPipeline.id, editingPipeline)
      if (response.success && response.data) {
        setPipelines((prev) => 
          prev.map((pipeline) => 
            pipeline.id === editingPipeline.id ? {...response.data, ...pipeline} : pipeline
          )
        )
        // Update the model as well
        setModels((prev) => 
          prev.map((model) => 
            model.id === editingPipeline.id ? {...response.data, ...model} : model
          )
        )
        setIsEditDialogOpen(false)
        setEditingPipeline(null)
        toast({
          title: "Success",
          description: "Pipeline updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: (typeof response.error === 'string' ? response.error : JSON.stringify(response.error)) || "Failed to update pipeline",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pipeline: " + (error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : "Unknown error"),
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(Array.from(files))
    }
  }

  const handleEditPipeline = async (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    // Reset valves display state
    setShowValves(false);
    setPipelineValue(null);
    // Fetch valves configuration when editing
    try {
      const response = await apiClient.getPipelineValves(pipeline.id);
      if (response.success && response.data) {
        setPipelineValue(response.data);
        setShowValves(true);
      }
    } catch (error) {
      toast(
        {
          title:"Error",
          description:`${error}`,
          variant:"destructive"
        }
      )
    }
    setIsEditDialogOpen(true);
  }
  const modelGrid = (models: any) => {
    return (
      <>
      {models.map((model: any) => (
        <Card key={model.id} className="glass border-primary/20 p-6 hover:border-primary/40 transition-all group">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 glass rounded-lg border border-primary/30 group-hover:border-primary/50 transition-all">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
<h3 className="font-semibold text-lg mb-1">
  {model.id.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
</h3>
                <p className="text-sm text-muted-foreground">{model.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="glass border-accent/30 text-accent hover:bg-accent/10 bg-transparent"
                onClick={() => handleEditPipeline({ ...model })}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="glass border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                onClick={() => {
                  // Find the urlIdx for this pipeline
                  const pipelineInfo = PIPELINE_LIST.find((p: any) => p.id === model.id);
                  const urlIdx = pipelineInfo ? pipelineInfo.idx : 0;
                  deletePipeline(model.id, urlIdx);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
        
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">Task Pipelines</h1>
          <p className="text-muted-foreground">Automate workflows and manage task execution</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-primary/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="neon-text">Create New Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Pipeline Url</Label>
                <Select value={newPipeline.url} onValueChange={(value) => setNewPipeline({...newPipeline, url: value})} >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Pipeline Url" />
                  </SelectTrigger>
                  <SelectContent>
                    
                    {PIPELINE_LIST && PIPELINE_LIST.map((pipeline: any) => (
                      <SelectItem key={pipeline.idx} value={pipeline.url}>
                        {pipeline.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upload Pipeline File</Label>
                <div className="flex flex-row items-center gap-2">
                  <div className="flex-1">
                    <Input 
                      ref={fileInputRef}
                      placeholder="Upload Python file" 
                      className="glass border-primary/20" 
                      type="file" 
                      accept=".py"
                      id="pipeline-input-file"
                      onChange={handleFileChange}
                      hidden
                      
                    />
                    <Button 
                      className="text-neon-glow w-full text-sm font-medium py-2 bg-transparent hover:bg-transparent-100 border border-dashed dark:border-gray-850 dark:hover:bg-gray-850 text-center rounded-xl"
                      onClick={() => {
                        document.getElementById("pipeline-input-file")?.click()
                      }}
                    >
                      {selectedFile && selectedFile.length > 0 ? (
                        <>
                          {selectedFile.length} pipeline(s) selected.
                        </>
                      ) : (
                        <>
                          Click here to select a py file.
                        </>
                      )}
                    </Button>
                  </div>
                  <Button 
                    className="neon-glow" 
                    disabled={!selectedFile || selectedFile.length === 0} 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                        setSelectedFile([]);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Install from GitHub URL</Label>
                <div className="flex flex-row items-center gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder="https://raw.githubusercontent.com/..." 
                      className="glass border-primary/20" 
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter raw GitHub URL for pipeline file
                    </p>
                  </div>
                  <Button 
                    className="neon-glow" 
                    onClick={() => setNewPipeline({...newPipeline, url: manualUrl})}
                    disabled={!manualUrl}
                  >
                    <Download className="w-4 h-4"/>
                  </Button>
                </div>
              </div>
            
              <Button 
                className="w-full neon-glow" 
                onClick={createPipeline}
                disabled={!newPipeline.url && !manualUrl && (!selectedFile || selectedFile.length === 0)}
              >
                Create Pipeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipelines</p>
              <p className="text-3xl font-bold mt-1">{models.length}</p>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between"> 
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-3xl font-bold mt-1">{models.filter((p) => p.status === "running").length}</p>
            </div>
            <Play className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
              <p className="text-3xl font-bold mt-1">{models.reduce((acc, p) => acc + (p.executions || 0), 0)}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-3xl font-bold mt-1">
                {pipelines.length > 0 
                  ? ((models.reduce((acc, p) => acc + (p.successRate || 0), 0) / (pipelines.length || 1))).toFixed(1)
                  : "0.0"}%
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-secondary" />
          </div>
        </Card>
      </div>

      {/* Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.isArray(models) && models.map((model) => modelGrid([model]))}
      </div>

      {/* Edit Pipeline Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-strong border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="neon-text">Edit Pipeline</DialogTitle>
          </DialogHeader>
          {editingPipeline && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Valves Configuration</Label>
                <Button onClick={() =>{ 
                  fetchValue(editingPipeline.name) 
                  
                }}>
                  {showValves ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {pipelineValue && showValves && (
                  <div className="mt-4 space-y-3">
                    <div>
                      {JSON.stringify(pipelineValue, null, 2)}
                      <Button 
                        className="mt-2"
                        onClick={async () => {
                          if (editingPipeline) {
                            try {
                              const response = await apiClient.updatePipelineValves(editingPipeline.id, pipelineValue);
                              if (response.success) {
                                toast({
                                  title: "Success",
                                  description: "Valves configuration updated successfully",
                                });
                              } else {
                                toast({
                                  title: "Error",
                                  description: typeof response.error === 'object' ? JSON.stringify(response.error) : response.error || "Failed to update valves configuration",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update valves configuration",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        Save Valves
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="neon-glow" onClick={updatePipeline}>
              Update Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
