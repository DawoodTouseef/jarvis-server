"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield,  Save, Upload,Settings,Lock ,Copy,EyeOff,Eye,AudioLines,Download ,Home, Plus, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { UserList } from "./Userlist"

interface User{
    id?: string,
    email?: string,
    name?: string,
    role?: string,
    profile_image_url?: string,
    token?: string,
    token_type?: string,
    expires_at?: string,
    permissions?: any,
    bio?: string,
    gender?: string,
    date_of_birth?: string
}

interface UserTableItem {
  id: string;
  name: string;
  email: string;
  role: string;
  date_of_birth?: string;
}

interface AudioConfig {
   stt: {
     ENGINE?: string,
     OPENAI_API_BASE_URL?: string,
     OPENAI_API_KEY?: string,
     DEEPGRAM_API_KEY?: string,
     API_KEY?:string
   },
   tts: {
     ENGINE?: string,
     VOICE?: string,
     SPLIT_ON?: string,
     MODEL?: string,
   }
}

interface HomeArea {
  id: number
  name: string
  icon?: string
}

export function SettingsPanel() {
  const [user, setUser] = useState<User>({} as User)
  const [audioconfig, setAudioConfig] = useState<AudioConfig>({
    stt:{},
    tts:{}
  });
  const [showchange, setShowChange]= useState(false);
  const [showchange1, setShowChange1]= useState(false);
  const [hideapi, setHideApiKey]= useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [sttengine, setSttEngine]=useState("whisper");
  const [ttsengine, setTtsEngine]=useState("");
  const [settings, setSettings] = useState({
    // Profile
    name: "Demo User",
    email: "demo@example.com",
    avatar: "",
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    // Security
    twoFactor: false,
    sessionTimeout: "30",
    // Appearance
    theme: "dark",
    accentColor: "cyan",
    animations: true,
  })
  const [users, setUsers] = useState<UserTableItem[]>([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserTableItem | null>(null);
  const [allusers, setAllUsers] = useState<UserTableItem[]>([]);

  // Home structure state
  const [floors, setFloors] = useState<string[]>([])
  const [areas, setAreas] = useState<HomeArea[]>([])
  const [subAreas, setSubAreas] = useState<HomeArea[]>([])
  const [newArea, setNewArea] = useState({ name: "", icon: "" })
  const [editingArea, setEditingArea] = useState<HomeArea | null>(null)

  useEffect(() => {
      const fetchUsers = async () => {
        try {
          const response = await apiClient.getSessionUser();
          if (response.data) {
            setUser(prevUser => ({
              ...prevUser,
              ...response.data
            }));
            
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
      const fetchAllUsers = async () => {
        try {
          const response = await apiClient.getUsers();
          if (response.data) {
            setAllUsers(response.data.users);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
      fetchAllUsers();
      fetchUsers()
      
      const fetchaudioconfig = async () => { 
        try { 
          const response = await apiClient.getAudioConfig();
          if (response.data) {
            setAudioConfig(response.data);
            console.log(response.data);
          }
          } catch (error) {
          console.error("Error fetching audio config:", error);
        } 
      }
      fetchaudioconfig();

      loadHomeStructure();
    }, [])

  // Load home structure data
  const loadHomeStructure = async () => {
    // Load actual home areas from the API
    await loadHomeAreas();
  }

  // Load home areas data
  const loadHomeAreas = async () => {
    try {
      const response = await apiClient.getHomeAssistantAreas()
      if (response.success && response.data) {
        setAreas(response.data)
      }
    } catch (error) {
      console.error("Error loading home areas:", error)
      toast({
        title: "Error",
        description: "Failed to load home areas",
        variant: "destructive"
      })
    }
  }

  // Add a new area
  const handleAddArea = async () => {
    if (newArea.name.trim()) {
      try {
        const areaData = {
          name: newArea.name,
          icon: newArea.icon || null
        }
        
        const response = await apiClient.createHomeAssistantArea(areaData)
        if (response.success && response.data) {
          // Refresh the areas list
          await loadHomeAreas()
          setNewArea({ name: "", icon: "" })
          toast({
            title: "Success",
            description: "Area added successfully"
          })
        } else {
          throw new Error(response.error || "Failed to add area")
        }
      } catch (error) {
        console.error("Error adding area:", error)
        toast({
          title: "Error",
          description: "Failed to add area",
          variant: "destructive"
        })
      }
    }
  }

  // Update an area
  const handleUpdateArea = async () => {
    if (editingArea) {
      try {
        // Note: In a real implementation, we would have an update endpoint
        // For now, we'll simulate the update by showing a toast
        toast({
          title: "Info",
          description: "Area update functionality would be implemented in a full version",
          variant: "default"
        })
        setEditingArea(null)
        setNewArea({ name: "", icon: "" })
      } catch (error) {
        console.error("Error updating area:", error)
        toast({
          title: "Error",
          description: "Failed to update area",
          variant: "destructive"
        })
      }
    }
  }

  // Delete an area
  const handleDeleteArea = async (areaId: number) => {
    try {
      // Note: In a real implementation, we would have a delete endpoint
      // For now, we'll simulate the delete by showing a toast
      toast({
        title: "Info",
        description: "Area delete functionality would be implemented in a full version",
        variant: "default"
      })
      // Refresh the areas list
      await loadHomeAreas()
    } catch (error) {
      console.error("Error deleting area:", error)
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
        variant: "default"

      })
      setTimeout(() => setCopySuccess(''), 2000); // Reset message after 2 seconds
    } catch (err) {
      setCopySuccess('Failed to copy!');
    }
  };
  const handleupdateAudioConfig = async ()=>{ 
    try {
      const updatedConfig = {
        ...audioconfig,
        stt: {
          ...audioconfig.stt,
          ENGINE: sttengine
        },
        tts: {
          ...audioconfig.tts,
          ENGINE: ttsengine
        }
      };
      setAudioConfig(updatedConfig);
      const response = await apiClient.updateAudioConfig(updatedConfig);
      if (response.data) {

        console.log("Audio config updated successfully");
      } else {
        console.error("Failed to update audio config:", response.error);
      }
    } catch (error) {
      console.error("Error updating audio config:", error);
    }
  }
  const handleUpdateHome = async ()=>{ 
    try {
      const response = await apiClient.updateConfig({}); // Placeholder for actual home update
      if (response.success) {
        console.log("Home updated successfully");
      } else {
        console.error("Failed to update home:", response.error);
      }
    } catch (error) {
      console.error("Error updating home:", error);
    }
  }
  
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold neon-text mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="glass border-primary/20">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary/20">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          {user.role==='admin' && (
            <TabsTrigger value="audio" className="data-[state=active]:bg-primary/20">
            <AudioLines className="w-4 h-4 mr-2" />
            Audio
          </TabsTrigger>
          )}
          <TabsTrigger value="accounts" className="data-[state=active]:bg-primary/20">
            <User className="w-4 h-4 mr-2" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="home" className="data-[state=active]:bg-primary/20">
            <Home className="w-4 h-4 mr-2" />
            Home
          </TabsTrigger>
          {user.role==='admin' && (
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
            <User className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          )}
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <Card className="glass border-primary/20 p-6">
            <h2 className="text-xl font-semibold mb-6">Your Account</h2>
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold">
                  <img src={user.profile_image_url}/>
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <Button variant="outline" size="sm" className="glass border-primary/30 bg-transparent">
                    <Upload className="w-4 h-4 mr-2"/>
                    Upload Image
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={user.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="glass border-primary/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="glass border-primary/20"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input 
                  id="bio" 
                  placeholder="Tell us about yourself..." 
                  className="glass border-primary/20" 
                  value={user.bio || ""} 
                  onChange={(e) => setUser({...user, bio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={user.gender || "Prefer not to say"} onValueChange={(value) => setUser({...user, gender: value})}>
                  <SelectTrigger className="glass border-primary/20">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent> 
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input 
                  id="date_of_birth" 
                  type="date" 
                  className="glass border-primary/20" 
                  value={user.date_of_birth || ""} 
                  onChange={(e) => setUser({...user, date_of_birth: e.target.value})}
                />
              </div>
              <hr className="border-primary/20"/>
              <div className="space-y-2">
                <div className="space-y-2">
                    <Label>Change Password</Label>
                    <div>
                      <Button variant="outline" size="sm" className="glass border-primary/30 bg-transparent" onClick={() => setShowChange(!showchange)}>
                      <Lock className="w-4 h-4 mr-2"/>
                      {showchange ? "Hide" : "Show"}
                    </Button>
                    </div>
                    {showchange && (
                      <div className="space-y-3">
                      <Input type="password" placeholder="Current password" className="glass border-primary/20"/>
                      <Input type="password" placeholder="New password" className="glass border-primary/20" />
                      <Input type="password" placeholder="Confirm new password" className="glass border-primary/20" />
                      <Button variant="outline" className="glass border-primary/30 bg-transparent">
                        Update Password
                      </Button>
                    </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>API Key</Label>

                    <div>
                      <Button variant="outline" size="sm" className="glass border-primary/30 bg-transparent" onClick={() => setShowChange1(!showchange1)}>
                      <Lock className="w-4 h-4 mr-2"/>
                      {showchange1 ? "Hide" : "Show"}
                    </Button>
                    </div>
                    {showchange1 && (
                      <>
                      <Label>JWT Token</Label>
                      <div className="flex gap-2">
                  <Input
                    type={hideapi ? 'password' : 'text'}
                    value={user.token}
                    readOnly
                    className="glass border-primary/20"
                  />
                  <Button variant="outline" className="glass border-primary/30 bg-transparent" onClick={() => setHideApiKey(!hideapi)}>
                    {hideapi ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  </Button>
                  <Button variant="outline" className="glass border-primary/30 bg-transparent" onClick={() => copyToClipboard(user.token || "")}>
                    <Copy className="w-4 h-4 mr-2" />
                  </Button>
                </div>
                <div className="flex gap-2"> 
                <Label>API Key</Label>
                <div className="flex gap-3">
                  <Button className="glass border-primary/30 bg-transparent">Create a neew secret Key</Button>
                </div>
                </div>
                <p className="text-xs text-muted-foreground">Keep your API key secure and never share it publicly</p>
                      </>
                    )}
                
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio" className="space-y-6">
          <Card className="glass border-primary/20 p-6">
            <h2 className="text-xl font-semibold mb-6">Audio Settings</h2>
            
            {/* Speech to Text Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Speech to Text</h3>
              <hr className="border-primary/20 mb-6"/>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Speech-to-text Engine</Label>
                  <Select onValueChange={(value) =>(setSttEngine(value))}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue  placeholder="Select Engine"/>
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
                      <SelectItem value="whisper">Whisper(Local)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                    </SelectContent>
                  </Select>
                        {sttengine== "openai" && <div className="space-y-2">
                            <div className="flex space-x-2">
                                                      <Input
                                                        type="text"
                                                        placeholder="OpenAI API Base URL"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            OPENAI_API_BASE_URL: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Input
                                                        type={hideapi ? "password" : "text"}
                                                        placeholder="OpenAI API Key"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.OPENAI_API_KEY || ''}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            OPENAI_API_KEY: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Button
                                                        variant="outline"
                                                        className="glass border-primary/30 bg-transparent"
                                                        onClick={() => setHideApiKey(!hideapi)}
                                                      >
                                                        {hideapi ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                      </Button>
                            </div>
                          
                      </div>
                      }
                      {sttengine== "deepgram" && <div className="space-y-2">
                        <Input
                                                        type={hideapi ? "password" : "text"}
                                                        placeholder="Deepgram API Key"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.DEEPGRAM_API_KEY || ''}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            DEEPGRAM_API_KEY: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Button
                                                        variant="outline"
                                                        className="glass border-primary/30 bg-transparent"
                                                        onClick={() => setHideApiKey(!hideapi)}
                                                      >
                                                        {hideapi ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                      </Button>
                        </div>
                        }
                      {sttengine== "whisper" && <div className="space-y-2">
                          <div className="flex space-x-2">
                        <Input
                        type="text"
                        value={"base"}
                        readOnly
                        />  
                        <Button>
                          <Download/>
                        </Button>
                        </div>
                        </div>
                      }
                    
                </div>
              </div>
            </div>
            
            {/* Text to Speech Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Text-to-Speech</h3>
              <hr className="border-primary/20 mb-6"/>
              <div className="space-y-6">
                <div className="flex space-x-2">
                  <Label>Text-to-Speech Engine</Label>
                  <div className="flex space-x-2 justify-end w-full">
                      <Select onValueChange={(value) => setTtsEngine(value)}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Select Engine" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
                      <SelectItem value="web">Web API</SelectItem>
                      <SelectItem value="transformers">Transformers (Local)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="azure">Azure AI Speech</SelectItem>
                    </SelectContent>
                  </Select>

                  </div>
                </div>
                
                {ttsengine== "web" && (
                  <>
                  <div className="space-y-2">
                  <Label>TTS Voice</Label>
                  <Select onValueChange={(value) => setAudioConfig({
                    ...audioconfig,
                    tts: {
                      ...audioconfig.tts,
                      VOICE: value
                    }
                  })}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="Microsoft David - English (United States)">Microsoft David - English (United States)</SelectItem>
                      <SelectItem value="Microsoft Mark - English (United States)">Microsoft Mark - English (United States)</SelectItem>
                      <SelectItem value="Microsoft Zira - English (United States)">Microsoft Zira - English (United States)</SelectItem>
                      <SelectItem value="Rudolph">Rudolph</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  </>
                )}
                {ttsengine== "transformers" && ( 
                  <>
                  <div className="space-y-2">
                  <Label>TTS Model</Label>
                  <Input 
                  type="text"
                  placeholder="CMU ARCTIC speaker embedding name"
                  value={audioconfig.tts.MODEL || ""}
                  onChange={(e) => setAudioConfig({
                    ...audioconfig,
                    tts: {
                      ...audioconfig.tts,
                      MODEL: e.target.value
                    }
                  })}
                  />
                </div>
                  </>
                )}
                {ttsengine== "openai" && <div className="space-y-2">
                            <div className="flex space-x-2">
                                                      <Input
                                                        type="text"
                                                        placeholder="OpenAI API Base URL"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            OPENAI_API_BASE_URL: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Input
                                                        type={hideapi ? "password" : "text"}
                                                        placeholder="OpenAI API Key"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.OPENAI_API_KEY || ''}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            OPENAI_API_KEY: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Button
                                                        variant="outline"
                                                        className="glass border-primary/30 bg-transparent"
                                                        onClick={() => setHideApiKey(!hideapi)}
                                                      >
                                                        {hideapi ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                      </Button>
                            </div>
                          
                      </div>
                }
                {ttsengine== "elevenlabs" && (
                  <>
                  <div className="flex space-x-2">
                  
                  <Input
                                                        type={hideapi ? "password" : "text"}
                                                        placeholder=" Eleven Labs API Key"
                                                        className="glass border-primary/20 flex-1"
                                                        value={audioconfig.stt.API_KEY || ''}
                                                        onChange={(e) => setAudioConfig({
                                                          ...audioconfig,
                                                          stt: {
                                                            ...audioconfig.stt,
                                                            API_KEY: e.target.value
                                                          }
                                                        })}
                                                      />
                                                      <Button
                                                        variant="outline"
                                                        className="glass border-primary/30 bg-transparent"
                                                        onClick={() => setHideApiKey(!hideapi)}
                                                      >
                                                        {hideapi ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                      </Button>
                  </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Response splitting</Label>
                  <div className="flex space-x-2 justify-end w-full">
                  <Select onValueChange={(value) => setAudioConfig({
                    ...audioconfig,
                    tts: {
                      ...audioconfig.tts,
                      SPLIT_ON: value
                    }
                  })}>
                    
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Punctuation" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
                      <SelectItem value="punctuation">Punctuation</SelectItem>
                      <SelectItem value="paragraphs">Paragraphs</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Control how message text is split for TTS requests. 'Punctuation' splits into sentences, 'paragraphs' splits into paragraphs, and 'none' keeps the message as a single string.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleupdateAudioConfig} className="neon-glow">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="glass border-primary/20 p-6">
            <h2 className="text-xl font-semibold mb-6">WebUI Settings</h2>
            <div className="space-y-6">
              <Label>Theme</Label>
              <Select value={settings.theme || "system"} onValueChange={(value) => setSettings({...settings, theme: value})}>
                <SelectTrigger className="glass border-primary/20"> 
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        {/* Home Tab */}
        <TabsContent value="home" className="space-y-6"> 
        <Card className="glass border-primary/20 p-6">
          <h2 className="text-xl font-semibold mb-6">Configure Home Structure</h2>
          <div className="space-y-6">
            {/* Floors Section - Using Areas as Floors for this implementation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Floors</h3>
                <div className="flex gap-2">
                  <Input
                    value={newArea.name}
                    onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                    placeholder="Floor name"
                    className="glass border-primary/20 w-40"
                  />
                  <Button 
                    onClick={handleAddArea}
                    className="neon-glow"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Floor
                  </Button>
                </div>
              </div>
              
              {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <div key={area.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <span>{area.name}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingArea(area)
                            setNewArea({ name: area.name, icon: area.icon || "" })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteArea(area.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <p className="text-muted-foreground text-center py-4">No floors configured yet</p>
                </div>
              )}
            </div>

            {/* Areas Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Areas</h3>
                <div className="flex gap-2">
                  <Input
                    value={newArea.name}
                    onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                    placeholder="Area name"
                    className="glass border-primary/20 w-40"
                  />
                  <Button 
                    onClick={handleAddArea}
                    className="neon-glow"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Area
                  </Button>
                </div>
              </div>
              
              {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <div key={area.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <span>{area.name}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingArea(area)
                            setNewArea({ name: area.name, icon: area.icon || "" })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteArea(area.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <p className="text-muted-foreground text-center py-4">No areas configured yet</p>
                </div>
              )}
            </div>

            {/* Sub-Areas Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Sub-Areas</h3>
                <div className="flex gap-2">
                  <Input
                    value={newArea.name}
                    onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                    placeholder="Sub-area name"
                    className="glass border-primary/20 w-40"
                  />
                  <Button 
                    onClick={handleAddArea}
                    className="neon-glow"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-Area
                  </Button>
                </div>
              </div>
              
              {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <div key={area.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <span>{area.name}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingArea(area)
                            setNewArea({ name: area.name, icon: area.icon || "" })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteArea(area.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <p className="text-muted-foreground text-center py-4">No sub-areas configured yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
            <UserList/>
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
