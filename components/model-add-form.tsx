"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Cpu, 
  Plus, 
  Upload, 
  Eye, 
  FileUp, 
  Image, 
  Search,
  ChevronLeft,
  Check
} from "lucide-react"
import { apiClient ,KnowledgeBase as KnowledgeBaseType } from "@/lib/api"
import { toast } from "@/hooks/use-toast"



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

interface ModelAddFormProps {
  models: Model[] // Array of all models for base model selection
  onSave: (newModel: any) => void
  onCancel: () => void
}

export function ModelAddForm({ models, onSave, onCancel }: ModelAddFormProps) {
  const [formData, setFormData] = useState({
    id: "",
    base_model_id: "",
    name: "",
    description: "",
    visibility: "public", // Default to public
    systemPrompt: "",
    tags: [] as string[],
    capabilities: {
      vision: false,
      fileUpload: false,
      webSearch: false,
      imageGeneration: false,
      codeInterpreter: false,
      usage: false,
      citations: false,
      statusUpdates: false,
    },
    profileImageUrl: "/static/favicon.png",
    // Advanced LLM parameters
    temperature: 0.7,
    topP: 1.0,
    topK: 50,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    maxTokens: 2048,
    stopSequences: [] as string[],
    seed: null as number | null,
    provider: "openai",
    type: "chat",
    params: {
      knowledge: ""
    } as { knowledge?: string },

  })
  
  const [newTag, setNewTag] = useState("")
  const [isAdvancedParamsOpen, setIsAdvancedParamsOpen] = useState(false)
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false)
  const [newStopSequence, setNewStopSequence] = useState("")
  const [showDescription, setShowDescription] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseType[]>([])
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const fetchKnowledgeBases = async () => {
    try {
      const res = await apiClient.getKnowledgeBases()
      if (res.success && res.data) {
        setKnowledgeBases(res.data)
      } else {
        toast({ title:"Error",description: res.error || "Failed to fetch knowledge bases",variant:"destructive" })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch knowledge bases",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])
  const handleSelectChange = (name: string, value: any) => {
    if (name === "params") {
      setFormData(prev => ({
        ...prev,
        params: {
          ...prev.params,
          ...value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Handle number input changes
  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }))
    }
  }

  // Handle integer input changes
  const handleIntegerChange = (name: string, value: string) => {
    const intValue = parseInt(value, 10)
    if (!isNaN(intValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: intValue
      }))
    }
  }

  // Handle capability toggle
  const handleCapabilityToggle = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: !prev.capabilities[capability as keyof typeof prev.capabilities]
      }
    }))
  }

  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }))
  }

  // Handle stop sequence addition
  const handleAddStopSequence = () => {
    if (newStopSequence.trim() && !formData.stopSequences.includes(newStopSequence.trim())) {
      setFormData(prev => ({
        ...prev,
        stopSequences: [...prev.stopSequences, newStopSequence.trim()]
      }))
      setNewStopSequence("")
    }
  }

  // Handle stop sequence removal
  const handleRemoveStopSequence = (sequenceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      stopSequences: prev.stopSequences.filter((seq: string) => seq !== sequenceToRemove)
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare the model data for creation
      const newModelData = {
        id: formData.id || `${formData.name}-${Date.now()}`,
        name: formData.name,
        base_model_id: formData.base_model_id || null,
        meta: {
          profile_image_url: formData.profileImageUrl,
          description: formData.description,
          capabilities: formData.capabilities,
          
        },
        params: {
          systemPrompt: formData.systemPrompt,
          temperature: formData.temperature,
          top_p: formData.topP,
          top_k: formData.topK,
          frequency_penalty: formData.frequencyPenalty,
          presence_penalty: formData.presencePenalty,
          max_tokens: formData.maxTokens,
          stop: formData.stopSequences,
          seed: formData.seed,
        },
        access_control: null,
        is_active: true
      }

      const response = await apiClient.createNewModel(newModelData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Model created successfully",
        })
        onSave(response.data)
        // Navigate back to the models page
        onCancel()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create model",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create model",
        variant: "destructive",
      })
    }
  }
  
  return (
    <div className="flex-1 mt-3 lg:mt-0 px-[16px] lg:pr-[16px] lg:pl-0 overflow-y-scroll scrollbar-hidden">
      <button 
        className="flex space-x-1 mb-4"
        onClick={onCancel}
      >
        <div className="self-center">
          <ChevronLeft className="h-4 w-4" />
        </div> 
        <div className="self-center text-sm font-medium">Back</div>
      </button>
      
      <div className="w-full max-h-full flex justify-center">
        <form className="flex flex-col md:flex-row w-full gap-3 md:gap-6" onSubmit={handleSubmit}>
          <div className="self-center md:self-start flex justify-center my-2 shrink-0">
            <div className="self-center">
              <button 
                className="rounded-xl flex shrink-0 items-center bg-white shadow-xl group relative" 
                type="button"
              >
                <img 
                  src={formData.profileImageUrl} 
                  alt="model profile" 
                  className="rounded-xl size-72 md:size-60 object-cover shrink-0" 
                />
                <div className="absolute bottom-0 right-0 z-10">
                  <div className="m-1.5">
                    <div className="shadow-xl p-1 rounded-full border-2 border-white bg-gray-800 text-white group-hover:bg-gray-600 transition dark:border-black dark:bg-white dark:group-hover:bg-gray-200 dark:text-black">
                      <Upload className="size-5" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-white dark:bg-black rounded-lg opacity-0 group-hover:opacity-20 transition"></div>
              </button>
              <div className="flex w-full mt-1 justify-end">
                <button 
                  className="px-2 py-1 text-gray-500 rounded-lg text-xs" 
                  type="button"
                >
                  Reset Image
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <div className="mt-2 my-2 flex flex-col">
              <div className="flex-1">
                <div>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="text-3xl font-semibold w-full bg-transparent outline-hidden"
                    placeholder="Model Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <Label>Base Model</Label>
                <Select value={formData.base_model_id} onValueChange={(value) => handleSelectChange("base_model_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="my-1">
              <div className="mb-1 flex w-full justify-between items-center">
                <div className="self-center text-sm font-semibold">Description</div>
                <Button 
                  className="text-white bg-transparent hover:bg-transparent hover:text-white" 
                  onClick={() => setShowDescription(!showDescription)}
                >
                  <span className="ml-2 self-center">{showDescription ? "Custom" : "Default"}</span>
                </Button>
              </div>
              {showDescription && (
                <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter model description"
                className="w-full min-h-[100px]"
              />
              )}
            </div>

            <div className="mt-2 my-1">
              <div className="">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddTag}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-2">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-3xl text-white" style={{border:"5px solid gray"}}>
                <div className="rounded-lg flex flex-col gap-2">
                  <div className="">
                    <div className="text-sm font-semibold mb-1.5">Visibility</div>
                    <div className="flex gap-2.5 items-center mb-1">
                      <div>
                        <div className="p-2 bg-black/5  rounded-full">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <Select 
                          value={formData.visibility} 
                          onValueChange={(value) => handleSelectChange("visibility", value)}
                        >
                          <SelectTrigger className="outline-hidden bg-transparent text-sm font-medium rounded-lg block w-fit pr-10 max-w-full placeholder-gray-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-gray-400 font-medium">Accessible to all users</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-850 my-1.5" />

            <div className="my-2">
              <div className="flex w-full justify-between">
                <div className="self-center text-sm font-semibold">Model Params</div>
              </div>
              <div className="mt-2">
                <div className="my-1">
                  <div className="text-xs font-semibold mb-2">System Prompt</div>
                  <div>
                    <Textarea
                      name="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={handleInputChange}
                      placeholder="Write your model system prompt content here
 e.g.) You are Mario from Super Mario Bros, acting as an assistant."
                      className="text-sm w-full bg-transparent outline-hidden resize-none overflow-y-hidden"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex w-full justify-between">
                  <div className="self-center text-xs font-semibold">Advanced Params</div>
                  <button 
                    className="p-1 px-3 text-xs flex rounded-sm transition" 
                    type="button"
                    onClick={() => setIsAdvancedParamsOpen(!isAdvancedParamsOpen)}
                  >
                    <span className="ml-2 self-center">
                      {isAdvancedParamsOpen ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {isAdvancedParamsOpen && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Temperature</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="2"
                          value={formData.temperature}
                          onChange={(e) => handleNumberChange("temperature", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Controls randomness: Lower = more focused, Higher = more creative</p>
                      </div>
                      <div>
                        <Label className="text-xs">Top P</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={formData.topP}
                          onChange={(e) => handleNumberChange("topP", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nucleus sampling: Probability threshold for token selection</p>
                      </div>
                      <div>
                        <Label className="text-xs">Top K</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.topK}
                          onChange={(e) => handleIntegerChange("topK", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Limits token selection to top K options</p>
                      </div>
                      <div>
                        <Label className="text-xs">Frequency Penalty</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="-2"
                          max="2"
                          value={formData.frequencyPenalty}
                          onChange={(e) => handleNumberChange("frequencyPenalty", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Reduces repetition based on token frequency</p>
                      </div>
                      <div>
                        <Label className="text-xs">Presence Penalty</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="-2"
                          max="2"
                          value={formData.presencePenalty}
                          onChange={(e) => handleNumberChange("presencePenalty", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Reduces repetition based on token presence</p>
                      </div>
                      <div>
                        <Label className="text-xs">Max Tokens</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.maxTokens}
                          onChange={(e) => handleIntegerChange("maxTokens", e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum number of tokens to generate</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Stop Sequences</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.stopSequences.map((seq: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {seq}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveStopSequence(seq)}
                                className="text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <div className="flex items-center gap-2">
                            <Input
                              value={newStopSequence}
                              onChange={(e) => setNewStopSequence(e.target.value)}
                              placeholder="Add stop sequence"
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddStopSequence()
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={handleAddStopSequence}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sequences where generation will stop</p>
                      </div>
                      <div>
                        <Label className="text-xs">Seed</Label>
                        <Input
                          type="number"
                          value={formData.seed || ""}
                          onChange={(e) => setFormData(prev => ({...prev, seed: e.target.value ? parseInt(e.target.value) : null}))}
                          className="text-sm"
                          placeholder="Optional seed for deterministic results"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-850 my-1" />

            <div className="my-2">
              <div className="flex w-full justify-between items-center">
                <div className="flex w-full justify-between items-center">
                  <div className="self-center text-sm font-semibold">Prompt suggestions</div>
                  <button className="p-1 text-xs flex rounded-sm transition" type="button">
                    <span className="ml-2 self-center">Default</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-850 my-1.5" />

            <div className="my-2">
              <input type="file" hidden multiple />
              <div>
                <div className="mb-2">
                  <div className="flex w-full justify-between mb-1">
                    <div className="self-center text-sm font-semibold">Knowledge</div>
                  </div>
                  <div className="text-xs dark:text-gray-500">To attach knowledge base here, add them to the "Knowledge" workspace first.</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap flex-row text-sm gap-1">
                    <Select 
                          value={formData.params.knowledge} 
                          onValueChange={(value) => handleSelectChange("params", {"knowledge":value})}
                          
                        >
                          <SelectTrigger className="px-3.5 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/5 outline outline-1 outline-gray-100 dark:outline-gray-850 rounded-3xl" >
                            <SelectValue placeholder="Select Knowledge Base"/>
                          </SelectTrigger>
                          <SelectContent>
                              {knowledgeBases.map((kb: KnowledgeBaseType) => (
                                <SelectItem key={kb.id} value={kb.id}>
                                  {kb.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                    <div slot="content"></div>
                    <button className="px-3.5 py-1.5 font-medium hover:bg-black/5 dark:hover:bg-white/5 outline outline-1 outline-gray-100 dark:outline-gray-850 rounded-3xl" type="button">
                      <FileUp className="w-4 h-4 mr-1 inline" />
                      <Input type="file" multiple placeholder="Upload Files" onChange={(e) => {}}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-2">
              <div>
                <div className="flex w-full justify-between mb-1">
                  <div className="self-center text-sm font-semibold">Tools</div>
                </div>
                <div className="text-xs dark:text-gray-500">To select toolkits here, add them to the "Tools" workspace first.</div>
                <div className="flex flex-col"></div>
              </div>
            </div>

            <div className="my-2"></div>

            <div className="my-2"></div>

            <div className="my-2">
              <div>
                <div className="flex w-full justify-between mb-1">
                  <div className="self-center text-sm font-semibold">Capabilities</div>
                </div>
                <div className="flex items-center mt-2 flex-wrap">
                  {Object.entries(formData.capabilities).map(([capability, enabled]) => (
                    <div key={capability} className="flex items-center gap-2 mr-3 mb-2">
                      <button
                        type="button"
                        onClick={() => handleCapabilityToggle(capability)}
                        className={`outline -outline-offset-1 outline-[1.5px] outline-gray-200 dark:outline-gray-600 ${
                          enabled 
                            ? "bg-black outline-black text-white" 
                            : "hover:outline-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-white"
                        } transition-all rounded-sm inline-block w-3.5 h-3.5 relative`}
                      >
                        {enabled && (
                          <div className="top-0 left-0 absolute w-full flex justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                      <div className="py-0.5 text-sm capitalize">
                        <div className="flex">
                          {capability.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="my-2">
              <div>
                <div className="flex w-full justify-between mb-1">
                  <div className="self-center text-sm font-semibold">Default Features</div>
                </div>
                <div className="flex items-center mt-2 flex-wrap">
                  <div className="flex items-center gap-2 mr-3">
                    <button className="outline -outline-offset-1 outline-[1.5px] outline-gray-200 dark:outline-gray-600 hover:outline-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-white transition-all rounded-sm inline-block w-3.5 h-3.5 relative" type="button">
                      <div className="top-0 left-0 absolute w-full flex justify-center"></div>
                    </button>
                    <div className="py-0.5 text-sm capitalize">
                      <div className="flex">Web Search</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-3">
                    <button className="outline -outline-offset-1 outline-[1.5px] outline-gray-200 dark:outline-gray-600 hover:outline-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-white transition-all rounded-sm inline-block w-3.5 h-3.5 relative" type="button">
                      <div className="top-0 left-0 absolute w-full flex justify-center"></div>
                    </button>
                    <div className="py-0.5 text-sm capitalize">
                      <div className="flex">Image Generation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-3">
                    <button className="outline -outline-offset-1 outline-[1.5px] outline-gray-200 dark:outline-gray-600 hover:outline-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-white transition-all rounded-sm inline-block w-3.5 h-3.5 relative" type="button">
                      <div className="top-0 left-0 absolute w-full flex justify-center"></div>
                    </button>
                    <div className="py-0.5 text-sm capitalize">
                      <div className="flex">Code Interpreter</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-2 text-gray-300 dark:text-gray-700">
              <div className="flex w-full justify-between mb-2">
                <div className="self-center text-sm font-semibold">JSON Preview</div>
                <button 
                  className="p-1 px-3 text-xs flex rounded-sm transition" 
                  type="button"
                  onClick={() => setIsJsonPreviewOpen(!isJsonPreviewOpen)}
                >
                  <span className="ml-2 self-center">
                    {isJsonPreviewOpen ? "Hide" : "Show"}
                  </span>
                </button>
              </div>
              {isJsonPreviewOpen && (
                <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                  <pre className="text-xs text-green-400 overflow-x-auto">
                    {JSON.stringify(formData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="my-2 flex justify-end pb-20">
              <Button 
                type="submit"
                className="text-sm px-3 py-2 transition rounded-lg bg-black hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black flex w-full justify-center"
              >
                <div className="self-center font-medium">Create Model</div>
              </Button>
            </div>
          </div>
        </form>
        
      </div>
    </div>
  )
}