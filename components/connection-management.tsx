"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Settings, Server, Cloud, Eye, EyeOff, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ConnectionConfig {
  ENABLE_OPENAI_API: boolean;
  OPENAI_API_BASE_URLS: string[];
  OPENAI_API_KEYS: string[];
  OPENAI_API_CONFIGS: Record<string, any>;
  ENABLE_OLLAMA_API: boolean;
  OLLAMA_BASE_URLS: string[];
  OLLAMA_API_CONFIGS: Record<string, any>;
  ENABLE_DIRECT_CONNECTIONS: boolean;
  ENABLE_BASE_MODELS_CACHE: boolean;
}

interface ConnectionDetails {
  type: 'external' | 'local';
  baseUrl: string;
  apiKey: string;
  authType: string;
  prefixId: string;
  providerType: 'openai' | 'azure';
  modelIds: string[];
  tags: string[];
}

export function ConnectionManagement() {
  const [config, setConfig] = useState<ConnectionConfig>({
    ENABLE_OPENAI_API: true,
    OPENAI_API_BASE_URLS: [],
    OPENAI_API_KEYS: [""],
    OPENAI_API_CONFIGS: {},
    ENABLE_OLLAMA_API: true,
    OLLAMA_BASE_URLS: [],
    OLLAMA_API_CONFIGS: {},
    ENABLE_DIRECT_CONNECTIONS: false,
    ENABLE_BASE_MODELS_CACHE: false,
  });
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [newConnection, setNewConnection] = useState<ConnectionDetails>({
    type: 'external',
    baseUrl: '',
    apiKey: '',
    authType: 'bearer',
    prefixId: '',
    providerType: 'openai',
    modelIds: [],
    tags: [],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      
      // Fetch OpenAI config
      const openaiResponse = await apiClient.getOpenAIConfig();
      if (openaiResponse.success) {
        setConfig(prev => ({
          ...prev,
          ENABLE_OPENAI_API: openaiResponse.data.ENABLE_OPENAI_API,
          OPENAI_API_BASE_URLS: openaiResponse.data.OPENAI_API_BASE_URLS,
          OPENAI_API_KEYS: openaiResponse.data.OPENAI_API_KEYS ,
          OPENAI_API_CONFIGS: openaiResponse.data.OPENAI_API_CONFIGS,
        }));
      }

      // Fetch Ollama config
      const ollamaResponse = await apiClient.getOllamaConfig();
      
      if (ollamaResponse.success) {
        setConfig(prev => ({
          ...prev,
          ENABLE_OLLAMA_API: ollamaResponse.data.ENABLE_OLLAMA_API,
          OLLAMA_BASE_URLS: ollamaResponse.data.OLLAMA_BASE_URLS,
          OLLAMA_API_CONFIGS: ollamaResponse.data.OLLAMA_API_CONFIGS,
        }));
      }

      // Fetch Connections config
      const connectionsResponse = await apiClient.getConfig();
      if (connectionsResponse.success) {
        setConfig(prev => ({
          ...prev,
          ENABLE_DIRECT_CONNECTIONS: connectionsResponse.data.ENABLE_DIRECT_CONNECTIONS || false,
          ENABLE_BASE_MODELS_CACHE: connectionsResponse.data.ENABLE_BASE_MODELS_CACHE || false,
        }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch connection configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllConfigurations = async () => {
    setSaving(true);
    try {
      // Save OpenAI config
      const openaiResponse = await apiClient.updateOpenAIConfig({
        ENABLE_OPENAI_API: config.ENABLE_OPENAI_API,
        OPENAI_API_BASE_URLS: config.OPENAI_API_BASE_URLS,
        OPENAI_API_KEYS: config.OPENAI_API_KEYS,
        OPENAI_API_CONFIGS: config.OPENAI_API_CONFIGS,
      });

      if (!openaiResponse.success) {
        throw new Error(openaiResponse.error || "Failed to update OpenAI configuration");
      }

      // Save Ollama config
      const ollamaResponse = await apiClient.updateOllamaConfig({
        ENABLE_OLLAMA_API: config.ENABLE_OLLAMA_API,
        OLLAMA_BASE_URLS: config.OLLAMA_BASE_URLS,
        OLLAMA_API_CONFIGS: config.OLLAMA_API_CONFIGS,
      });

      if (!ollamaResponse.success) {
        throw new Error(ollamaResponse.error || "Failed to update Ollama configuration");
      }

      // Save Connections config
      const connectionsResponse = await apiClient.updateConfig({
        ENABLE_DIRECT_CONNECTIONS: config.ENABLE_DIRECT_CONNECTIONS,
        ENABLE_BASE_MODELS_CACHE: config.ENABLE_BASE_MODELS_CACHE,
      });

      if (!connectionsResponse.success) {
        throw new Error(connectionsResponse.error || "Failed to update connections configuration");
      }

      toast({
        title: "Success",
        description: "All configurations saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save configurations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddConnection = () => {
    setEditingIndex(null);
    setNewConnection({
      type: 'external',
      baseUrl: '',
      apiKey: '',
      authType: 'bearer',
      prefixId: '',
      providerType: 'openai',
      modelIds: [],
      tags: [],
    });
    setIsAddConnectionOpen(true);
  };

  const handleSaveConnection = async () => {
    try {
      // For now, we'll update the local state and then save all configurations
      if (newConnection.type === 'external') {
        const newUrls = [...config.OPENAI_API_BASE_URLS, newConnection.baseUrl];
        const newKeys = [...config.OPENAI_API_KEYS, newConnection.apiKey];
        
        // Create config entry for the new connection
        const configIndex = config.OPENAI_API_BASE_URLS.length;
        const newConfigs = {
          ...config.OPENAI_API_CONFIGS,
          [configIndex]: {
            auth_type: newConnection.authType,
            prefix_id: newConnection.prefixId,
            connection_type: newConnection.providerType,
            model_ids: newConnection.modelIds,
            tags: newConnection.tags,
          }
        };
        
        setConfig({
          ...config,
          OPENAI_API_BASE_URLS: newUrls,
          OPENAI_API_KEYS: newKeys,
          OPENAI_API_CONFIGS: newConfigs,
        });
      } else {
        const newUrls = [...config.OLLAMA_BASE_URLS, newConnection.baseUrl];
        
        // Create config entry for the new connection
        const configIndex = config.OLLAMA_BASE_URLS.length;
        const newConfigs = {
          ...config.OLLAMA_API_CONFIGS,
          [configIndex]: {
            auth_type: newConnection.authType,
            prefix_id: newConnection.prefixId,
            connection_type: newConnection.providerType,
            model_ids: newConnection.modelIds,
            tags: newConnection.tags,
          }
        };
        
        setConfig({
          ...config,
          OLLAMA_BASE_URLS: newUrls,
          OLLAMA_API_CONFIGS: newConfigs,
        });
      }
      
      // Save all configurations to backend
      await saveAllConfigurations();
      
      setIsAddConnectionOpen(false);
      toast({
        title: "Success",
        description: "Connection added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add connection",
        variant: "destructive",
      });
    }
  };

  const handleEditConnection = (type: 'external' | 'local', index: number) => {
    setEditingIndex(index);
    
    if (type === 'external') {
      const configEntry = config.OPENAI_API_CONFIGS[index] || {};
      setNewConnection({
        type: 'external',
        baseUrl: config.OPENAI_API_BASE_URLS[index] || '',
        apiKey: config.OPENAI_API_KEYS[index] || '',
        authType: configEntry.auth_type || 'bearer',
        prefixId: configEntry.prefix_id || '',
        providerType: configEntry.connection_type || 'openai',
        modelIds: configEntry.model_ids || [],
        tags: configEntry.tags || [],
      });
    } else {
      const configEntry = config.OLLAMA_API_CONFIGS[index] || {};
      setNewConnection({
        type: 'local',
        baseUrl: config.OLLAMA_BASE_URLS[index] || '',
        apiKey: '', // Ollama typically doesn't require API key
        authType: configEntry.auth_type || 'none',
        prefixId: configEntry.prefix_id || '',
        providerType: configEntry.connection_type || 'azure',
        modelIds: configEntry.model_ids || [],
        tags: configEntry.tags || [],
      });
    }
    
    setIsAddConnectionOpen(true);
  };

  const handleUpdateConnection = async () => {
    if (editingIndex === null) return;
    
    try {
      if (newConnection.type === 'external') { 
        const newUrls = [...config.OPENAI_API_BASE_URLS];
        const newKeys = [...config.OPENAI_API_KEYS];
        newUrls[editingIndex] = newConnection.baseUrl;
        newKeys[editingIndex] = newConnection.apiKey;
        
        const newConfigs = {
          ...config.OPENAI_API_CONFIGS,
          [editingIndex]: {
            auth_type: newConnection.authType,
            prefix_id: newConnection.prefixId,
            connection_type: newConnection.providerType,
            model_ids: newConnection.modelIds,
            tags: newConnection.tags,
          }
        };
        
        setConfig({
          ...config,
          OPENAI_API_BASE_URLS: newUrls,
          OPENAI_API_KEYS: newKeys,
          OPENAI_API_CONFIGS: newConfigs,
        });
      } else {
        const newUrls = [...config.OLLAMA_BASE_URLS];
        newUrls[editingIndex] = newConnection.baseUrl;
        
        const newConfigs = {
          ...config.OLLAMA_API_CONFIGS,
          [editingIndex]: {
            auth_type: newConnection.authType,
            prefix_id: newConnection.prefixId,
            connection_type: newConnection.providerType,
            model_ids: newConnection.modelIds,
            tags: newConnection.tags,
          }
        };
        
        setConfig({
          ...config,
          OLLAMA_BASE_URLS: newUrls,
          OLLAMA_API_CONFIGS: newConfigs,
        });
      }
      
      // Save all configurations to backend
      await saveAllConfigurations();
      
      setIsAddConnectionOpen(false);
      toast({
        title: "Success",
        description: "Connection updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update connection",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConnection = async (type: 'external' | 'local', index: number) => {
    try {
      if (type === 'external') {
        if (config.OPENAI_API_BASE_URLS.length <= 1) {
          toast({
            title: "Error",
            description: "Cannot delete the last OpenAI connection",
            variant: "destructive",
          });
          return;
        }
        
        const newUrls = [...config.OPENAI_API_BASE_URLS];
        const newKeys = [...config.OPENAI_API_KEYS];
        newUrls.splice(index, 1);
        newKeys.splice(index, 1);
        
        // Remove config entry
        const newConfigs = { ...config.OPENAI_API_CONFIGS };
        delete newConfigs[index];
        
        // Reindex configs
        const reindexedConfigs: Record<string, any> = {};
        Object.keys(newConfigs).forEach((key, idx) => {
          reindexedConfigs[idx] = newConfigs[key];
        });
        
        setConfig({
          ...config,
          OPENAI_API_BASE_URLS: newUrls,
          OPENAI_API_KEYS: newKeys,
          OPENAI_API_CONFIGS: reindexedConfigs,
        });
      } else {
        if (config.OLLAMA_BASE_URLS.length <= 1) {
          toast({
            title: "Error",
            description: "Cannot delete the last Ollama connection",
            variant: "destructive",
          });
          return;
        }
        
        const newUrls = [...config.OLLAMA_BASE_URLS];
        newUrls.splice(index, 1);
        
        // Remove config entry
        const newConfigs = { ...config.OLLAMA_API_CONFIGS };
        delete newConfigs[index];
        
        // Reindex configs
        const reindexedConfigs: Record<string, any> = {};
        Object.keys(newConfigs).forEach((key, idx) => {
          reindexedConfigs[idx] = newConfigs[key];
        });
        
        setConfig({
          ...config,
          OLLAMA_BASE_URLS: newUrls,
          OLLAMA_API_CONFIGS: reindexedConfigs,
        });
      }
      
      // Save all configurations to backend
      await saveAllConfigurations();
      
      toast({
        title: "Success",
        description: "Connection deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete connection",
        variant: "destructive",
      });
    }
  };
  const handleConnectionType = async (connection_type: string) => {
    if(connection_type==="external") {
      setNewConnection({...newConnection, type:  'local'});
    }
    if(connection_type==="local") {
      setNewConnection({...newConnection, type:  'external'});
    }
    
  };
  if (loading) {
    return <div>Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Connection Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI API Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">OpenAI API</h3>
              <Switch
                checked={config.ENABLE_OPENAI_API}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, ENABLE_OPENAI_API: checked })
                }
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manage OpenAI API Connections</span>
                <div className="flex gap-2">
                  <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>OpenAI API Settings</DialogTitle>
                        <DialogDescription>
                          Configure global OpenAI API settings
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Enable OpenAI API</Label>
                          <Switch
                            checked={config.ENABLE_OPENAI_API}
                            onCheckedChange={(checked) =>
                              setConfig({ ...config, ENABLE_OPENAI_API: checked })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" onClick={handleAddConnection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </div>
              
              {config.OPENAI_API_BASE_URLS.map((url, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Connection {index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{url}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditConnection('external', index)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteConnection('external', index)}
                      disabled={config.OPENAI_API_BASE_URLS.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ollama API Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Ollama API</h3>
              <Switch
                checked={config.ENABLE_OLLAMA_API}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, ENABLE_OLLAMA_API: checked })
                }
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manage Ollama API Connections</span>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ollama API Settings</DialogTitle>
                        <DialogDescription>
                          Configure global Ollama API settings
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Enable Ollama API</Label>
                          <Switch
                            checked={config.ENABLE_OLLAMA_API}
                            onCheckedChange={(checked) =>
                              setConfig({ ...config, ENABLE_OLLAMA_API: checked })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button>Close</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" onClick={handleAddConnection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </div>
              
              {config.OLLAMA_BASE_URLS.map((url, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Connection {index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{url}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditConnection('local', index)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteConnection('local', index)}
                      disabled={config.OLLAMA_BASE_URLS.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-muted-foreground">
                Trouble accessing Ollama?{" "}
                <a
                  href="https://github.com/open-webui/open-webui#troubleshooting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Click here for help.
                </a>
              </p>
            </div>
          </div>

          {/* Direct Connections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Direct Connections</h3>
              <Switch
                checked={config.ENABLE_DIRECT_CONNECTIONS}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, ENABLE_DIRECT_CONNECTIONS: checked })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Direct Connections allow users to connect to their own OpenAI compatible API endpoints.
            </p>
          </div>

          {/* Cache Base Model List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium">Cache Base Model List</h3>
              <Switch
                checked={config.ENABLE_BASE_MODELS_CACHE}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, ENABLE_BASE_MODELS_CACHE: checked })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Base Model List Cache speeds up access by fetching base models only at startup or on settings save—faster, but may not show recent base model changes.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={saveAllConfigurations} disabled={saving}>
              {saving ? "Saving..." : "Save "}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Connection Dialog */}
      <Dialog open={isAddConnectionOpen} onOpenChange={setIsAddConnectionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Connection" : "Add New Connection"}
            </DialogTitle>
            <DialogDescription>
              Configure connection details: connection type, base URL, API key, auth type, prefix ID, provider type, model IDs, and tags.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-right justify-between">
                <Label>Connection Type *</Label>
                <Button onClick={(e)=>{handleConnectionType(newConnection.type)}}
                  style={{ backgroundColor: "transparent", border: "none" ,color:"white"}}
                  >{newConnection.type}

                  
                </Button>
              </div>
              
            </div>
            
            <div className="space-y-2">
              <Label>Base URL *</Label>
              <Input
                placeholder={newConnection.type === 'external' 
                  ? "https://api.openai.com/v1" 
                  : "http://localhost:11434"}
                value={newConnection.baseUrl}
                onChange={(e) => setNewConnection({...newConnection, baseUrl: e.target.value})}
              />
            </div>
            
            {newConnection.type === 'external' && (
              <div className="space-y-2">
                <Label>Auth Type *</Label>
                <div className="flex space-x-2 items-center">
                  <Select 
                    value={newConnection.authType} 
                    onValueChange={(value) => setNewConnection({...newConnection, authType: value})}
                  >
                    <SelectTrigger className="w-1/3">
                      <SelectValue placeholder="Select auth type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="azure_ad">Azure AD</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2 items-center flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="API KEY"
                      value={newConnection.apiKey}
                      onChange={(e) => setNewConnection({...newConnection, apiKey: e.target.value})}
                    />
                    <Button onClick={() => setShowApiKey(!showApiKey)} variant="outline" size="icon">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Prefix ID</Label>
              <Input
                placeholder="Optional prefix for model IDs"
                value={newConnection.prefixId}
                onChange={(e) => setNewConnection({...newConnection, prefixId: e.target.value})}
              />
            </div>
            
            <div className="space-y-2 flex flex-row">
              <Label>Provider Type *</Label>
              <Select 
                value={newConnection.providerType} 
                onValueChange={(value) => setNewConnection({...newConnection, providerType: value as 'openai' | 'azure'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Model IDs (comma separated)</Label>
              <Input
                placeholder="gpt-4,gpt-3.5-turbo,etc."
                value={newConnection.modelIds.join(',')}
                onChange={(e) => setNewConnection({...newConnection, modelIds: e.target.value.split(',').map(id => id.trim()).filter(id => id)})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                placeholder="tag1,tag2,etc."
                value={newConnection.tags.join(',')}
                onChange={(e) => setNewConnection({...newConnection, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingIndex !== null && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editingIndex !== null) {
                    const type = newConnection.type;
                    handleDeleteConnection(type, editingIndex);
                    setIsAddConnectionOpen(false);
                  }
                }}
              >
                Delete Connection
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsAddConnectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingIndex !== null ? handleUpdateConnection : handleSaveConnection}>
              {editingIndex !== null ? "Update" : "Add"} Connection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}