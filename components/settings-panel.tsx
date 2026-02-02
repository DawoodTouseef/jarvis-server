"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield,  Save, Upload,Settings,Lock ,Copy,EyeOff,Eye,AudioLines,Download ,Home, Plus, Edit, Trash2, Building, MapPin, Layers, Heart, Camera,
  Earth,PlugIcon,
  Cloud
 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { UserList } from "./Userlist"
import { IntegrationsManager } from "./integrations-manager"
import { Slider } from "./ui/slider"
import { Switch } from "./ui/switch"

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
  floor_id?: number
  label?: string
  image?: string
  aliases?: string[]
}

interface HomeFloor {
  id: number
  name: string
  level?: number
  icon?: string | null
  aliases?: string[]
}

interface HomeSubArea {
  id: number
  name: string
  area_id: number
  icon?: string | null
}

// Predefined list of commonly used icons
const COMMON_ICONS = [
  "Home", "Building", "Layers", "MapPin", "User", "Settings", 
  "Bell", "Heart", "Camera", "Lock", "Copy", "Eye", "EyeOff", 
  "AudioLines", "Download", "Plus", "Edit", "Trash2", "Shield"
];

// Map of icon names to actual Lucide React components
const IconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Building,
  Layers,
  MapPin,
  User,
  Settings,
  Bell,
  Heart,
  Camera,
  Lock,
  Copy,
  Eye,
  EyeOff,
  AudioLines,
  Download,
  Plus,
  Edit,
  Trash2,
  Shield
};
import {integrations} from "@/lib/api";
export function SettingsPanel() {
  const [user, setUser] = useState<User>({} as User)
  const [originalUser, setOriginalUser] = useState<User>({} as User)
  const [audioconfig, setAudioConfig] = useState<AudioConfig>({
    stt: {
      ENGINE: "whisper"
    },
    tts: {
      ENGINE: "web"
    }
  });
  const [apikey,setapikey] = useState("");
  const [showchange, setShowChange]= useState(false);
  const [showchange1, setShowChange1]= useState(false);
  const [hideapi, setHideApiKey]= useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [sttengine, setSttEngine]=useState("whisper");
  let webSearchEngines = [
		'ollama_cloud',
		'perplexity_search',
		'searxng',
		'yacy',
		'google_pse',
		'brave',
		'kagi',
		'mojeek',
		'bocha',
		'serpstack',
		'serper',
		'serply',
		'searchapi',
		'serpapi',
		'duckduckgo',
		'tavily',
		'jina',
		'bing',
		'exa',
		'perplexity',
		'sougou',
		'firecrawl',
		'external'
	];
	let webLoaderEngines = ['playwright', 'firecrawl', 'tavily', 'external'];
  const [websearchEngine, setWebsearchEngine]=useState("*");
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
  const [integrations, setIntegrations] = useState<integrations[]>([]);
  const [allusers, setAllUsers] = useState<UserTableItem[]>([]);
  const [isWebsearchEnabled, setWebsearchEnabled] = useState(false);
  const [byPassEmbedding, setByPassEmbedding] = useState(false);
  // Home structure state
  const [floors, setFloors] = useState<HomeFloor[]>([])
  const [areas, setAreas] = useState<HomeArea[]>([])
  const [subAreas, setSubAreas] = useState<HomeSubArea[]>([])
  const [ragconfig, setRagConfig] = useState<any>({});
  const [webconfig, setWebConfig] = useState<any>({});
  // Dialog states
  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [isAddAreaDialogOpen, setIsAddAreaDialogOpen] = useState(false);
  const [isAddSubAreaDialogOpen, setIsAddSubAreaDialogOpen] = useState(false);
  
  // Form states
  const [newFloor, setNewFloor] = useState({ name: "", level: 0, icon: "", aliases: "" })
  const [newArea, setNewArea] = useState({ name: "", floor_id: 0, icon: "", label: "", image: "", aliases: "" })
  const [newSubArea, setNewSubArea] = useState({ name: "", area_id: 0, icon: "" })
  
  const [editingFloor, setEditingFloor] = useState<HomeFloor | null>(null)
  const [editingArea, setEditingArea] = useState<HomeArea | null>(null)
  const [editingSubArea, setEditingSubArea] = useState<HomeSubArea | null>(null)

  useEffect(() => {
      const fetchUsers = async () => {
        try {
          const response = await apiClient.getSessionUser();
          if (response.data) {
            setUser(prevUser => ({
              ...prevUser,
              ...response.data
            }));
            setOriginalUser(prevUser => ({
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
      const fetchRagConfig = async () => { 
        try {
          const response = await apiClient.getRagConfig();
          if (response.success && response.data) {
            setRagConfig(response.data);
            setWebsearchEnabled(response.data.web?.ENABLE_WEB_SEARCH)
            setWebConfig(response.data.web)
          }
        } catch (error) {
          console.error("Error fetching Rag config:", error);
        }
      }
      fetchRagConfig();
      const fetchaudioconfig = async () => { 
        try { 
          const response = await apiClient.getAudioConfig();
          if (response.success && response.data) {
            setAudioConfig(response.data);
            // Initialize engine states
            if (response.data.stt?.ENGINE) {
              setSttEngine(response.data.stt.ENGINE);
            }
            if (response.data.tts?.ENGINE) {
              setTtsEngine(response.data.tts.ENGINE);
            }
          }
        } catch (error) {
          console.error("Error fetching audio config:", error);
        } 
      }
      fetchaudioconfig();

      loadHomeStructure();
      setIntegrations(
        [{
          id: "1",
          name: "Sample Integration",
          type: "API",
          enabled: true,
          icon: "Cloud",
          description: "This is a sample integration for demonstration purposes.",
          config: {}
        }]
      )
    }, [])

  // Load home structure data
  const loadHomeStructure = async () => {
    // Load actual home areas from the API
    await loadHomeFloors();
    await loadHomeAreas();
    await loadHomeSubAreas();
  }
  const generate_api_key = ()=>{
    apiClient.generate_api_key().then((response)=>{
      if(response.success && response.data){
        setapikey(response.data.api_key);
      }
    }).catch((error)=>{
      console.error("Error generating API key:", error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive"
      })
    })
  }
  // Load home floors data
  const loadHomeFloors = async () => {
    try {
      const response = await apiClient.getHomeAssistantFloors();
      if (response.success && response.data) {
        // Transform the response data to match our HomeFloor interface
        const transformedFloors: HomeFloor[] = response.data.map((floor: any) => ({
          id: floor.id,
          name: floor.name,
          level: floor.level || 0,
          icon: floor.icon || null,
          aliases: floor.aliases || []
        }));
        setFloors(transformedFloors);
      }
    } catch (error) {
      console.error("Error loading home floors:", error)
      toast({
        title: "Error",
        description: "Failed to load home floors",
        variant: "destructive"
      })
    }
  }

  // Load home areas data
  const loadHomeAreas = async () => {
    try {
      const response = await apiClient.getHomeAssistantAreasNew()
      if (response.success && response.data) {
        // Transform the response data to match our HomeArea interface
        const transformedAreas: HomeArea[] = response.data.map((area: any) => ({
          id: area.id,
          name: area.name,
          icon: area.icon || undefined,
          floor_id: area.floor_id || undefined,
          label: area.label || undefined,
          image: area.image || undefined,
          aliases: area.aliases || []
        }));
        setAreas(transformedAreas);
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

  // Load home sub-areas data
  const loadHomeSubAreas = async () => {
    try {
      const response = await apiClient.getHomeAssistantSubAreas();
      if (response.success && response.data) {
        // Transform the response data to match our HomeSubArea interface
        const transformedSubAreas: HomeSubArea[] = response.data.map((subArea: any) => ({
          id: subArea.id,
          name: subArea.name,
          area_id: subArea.area_id,
          icon: subArea.icon || null
        }));
        setSubAreas(transformedSubAreas);
      }
    } catch (error) {
      console.error("Error loading home sub-areas:", error)
      toast({
        title: "Error",
        description: "Failed to load home sub-areas",
        variant: "destructive"
      })
    }
  }

  // Function to check if user data has been modified
  const isUserDataModified = () => {
    return (
      user.name !== originalUser.name ||
      user.bio !== originalUser.bio ||
      user.gender !== originalUser.gender ||
      user.date_of_birth !== originalUser.date_of_birth ||
      user.profile_image_url !== originalUser.profile_image_url
    );
  };

  // Function to update user profile
  const handleUpdateProfile = async () => {
    try {
      // Prepare the profile update data according to the UpdateProfileForm model
      const profileData = {
        profile_image_url: user.profile_image_url || "",
        name: user.name || "",
        bio: user.bio || null,
        gender: user.gender || null,
        date_of_birth: user.date_of_birth || null
      };

      // Call the API to update profile
      const response = await apiClient.updateProfile(profileData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        // Update original user data to reflect changes
        setOriginalUser({ ...user });
      } else {
        // Ensure we're not trying to render an object as a React child
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : "Failed to update profile";
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Ensure we're not trying to render an object as a React child
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to update profile";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Add a new floor
  const handleAddFloor = async () => {
    if (newFloor.name.trim()) {
      try {
        const floorData = {
          name: newFloor.name,
          level: newFloor.level,
          icon: newFloor.icon || null,
          aliases: newFloor.aliases ? newFloor.aliases.split(',').map(alias => alias.trim()) : []
        }
        
        const response = await apiClient.createHomeAssistantFloor(floorData);
        if (response.success && response.data) {
          // Refresh the floors list
          await loadHomeFloors();
          setNewFloor({ name: "", level: 0, icon: "", aliases: "" });
          setIsAddFloorDialogOpen(false);
          
          toast({
            title: "Success",
            description: "Floor added successfully"
          });
        } else {
          throw new Error(response.error || "Failed to add floor")
        }
      } catch (error) {
        console.error("Error adding floor:", error)
        toast({
          title: "Error",
          description: "Failed to add floor",
          variant: "destructive"
        })
      }
    }
  }

  // Add a new area
  const handleAddArea = async () => {
    if (newArea.name.trim()) {
      try {
        const areaData = {
          name: newArea.name,
          floor_id: newArea.floor_id,
          icon: newArea.icon || null,
          label: newArea.label || null,
          image: newArea.image || null,
          aliases: newArea.aliases ? newArea.aliases.split(',').map(alias => alias.trim()) : []
        }
        
        const response = await apiClient.createHomeAssistantAreaNew(areaData)
        if (response.success && response.data) {
          // Refresh the areas list
          await loadHomeAreas()
          setNewArea({ name: "", floor_id: 0, icon: "", label: "", image: "", aliases: "" })
          setIsAddAreaDialogOpen(false);
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

  // Add a new sub-area
  const handleAddSubArea = async () => {
    if (newSubArea.name.trim()) {
      try {
        const subAreaData = {
          name: newSubArea.name,
          area_id: newSubArea.area_id,
          icon: newSubArea.icon || null
        }
        
        const response = await apiClient.createHomeAssistantSubArea(subAreaData);
        if (response.success && response.data) {
          // Refresh the sub-areas list
          await loadHomeSubAreas();
          setNewSubArea({ name: "", area_id: 0, icon: "" });
          setIsAddSubAreaDialogOpen(false);
          
          toast({
            title: "Success",
            description: "Sub-area added successfully"
          });
        } else {
          throw new Error(response.error || "Failed to add sub-area")
        }
      } catch (error) {
        console.error("Error adding sub-area:", error)
        toast({
          title: "Error",
          description: "Failed to add sub-area",
          variant: "destructive"
        })
      }
    }
  }

  // Update a floor
  const handleUpdateFloor = async () => {
    if (editingFloor) {
      try {
        const floorData = {
          name: newFloor.name,
          level: newFloor.level,
          icon: newFloor.icon || null,
          aliases: newFloor.aliases ? newFloor.aliases.split(',').map(alias => alias.trim()) : []
        }
        
        const response = await apiClient.updateHomeAssistantFloor(editingFloor.id, floorData);
        if (response.success && response.data) {
          // Refresh the floors list
          await loadHomeFloors();
          setEditingFloor(null);
          setNewFloor({ name: "", level: 0, icon: "", aliases: "" });
          
          toast({
            title: "Success",
            description: "Floor updated successfully"
          });
        } else {
          throw new Error(response.error || "Failed to update floor")
        }
      } catch (error) {
        console.error("Error updating floor:", error)
        toast({
          title: "Error",
          description: "Failed to update floor",
          variant: "destructive"
        })
      }
    }
  }

  // Update an area
  const handleUpdateArea = async () => {
    if (editingArea) {
      try {
        const areaData = {
          name: newArea.name,
          floor_id: newArea.floor_id,
          icon: newArea.icon || null,
          label: newArea.label || null,
          image: newArea.image || null,
          aliases: newArea.aliases ? newArea.aliases.split(',').map(alias => alias.trim()) : []
        }
        
        const response = await apiClient.updateHomeAssistantArea(editingArea.id, areaData);
        if (response.success && response.data) {
          // Refresh the areas list
          await loadHomeAreas();
          setEditingArea(null);
          setNewArea({ name: "", floor_id: 0, icon: "", label: "", image: "", aliases: "" });
          
          toast({
            title: "Success",
            description: "Area updated successfully"
          });
        } else {
          throw new Error(response.error || "Failed to update area")
        }
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

  // Update a sub-area
  const handleUpdateSubArea = async () => {
    if (editingSubArea) {
      try {
        const subAreaData = {
          name: newSubArea.name,
          area_id: newSubArea.area_id,
          icon: newSubArea.icon || null
        }
        
        const response = await apiClient.updateHomeAssistantSubArea(editingSubArea.id, subAreaData);
        if (response.success && response.data) {
          // Refresh the sub-areas list
          await loadHomeSubAreas();
          setEditingSubArea(null);
          setNewSubArea({ name: "", area_id: 0, icon: "" });
          
          toast({
            title: "Success",
            description: "Sub-area updated successfully"
          });
        } else {
          throw new Error(response.error || "Failed to update sub-area")
        }
      } catch (error) {
        console.error("Error updating sub-area:", error)
        toast({
          title: "Error",
          description: "Failed to update sub-area",
          variant: "destructive"
        })
      }
    }
  }

  // Delete a floor
  const handleDeleteFloor = async (floorId: number) => {
    try {
      const response = await apiClient.deleteHomeAssistantFloor(floorId);
      if (response.success) {
        // Refresh the floors list
        await loadHomeFloors();
        toast({
          title: "Success",
          description: "Floor deleted successfully"
        })
      } else {
        throw new Error(response.error || "Failed to delete floor")
      }
    } catch (error) {
      console.error("Error deleting floor:", error)
      toast({
        title: "Error",
        description: "Failed to delete floor",
        variant: "destructive"
      })
    }
  }

  // Delete an area
  const handleDeleteArea = async (areaId: number) => {
    try {
      const response = await apiClient.deleteHomeAssistantArea(areaId);
      if (response.success) {
        // Refresh the areas list
        await loadHomeAreas();
        toast({
          title: "Success",
          description: "Area deleted successfully"
        })
      } else {
        throw new Error(response.error || "Failed to delete area")
      }
    } catch (error) {
      console.error("Error deleting area:", error)
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive"
      })
    }
  }

  // Delete a sub-area
  const handleDeleteSubArea = async (subAreaId: number) => {
    try {
      const response = await apiClient.deleteHomeAssistantSubArea(subAreaId);
      if (response.success) {
        // Refresh the sub-areas list
        await loadHomeSubAreas();
        toast({
          title: "Success",
          description: "Sub-area deleted successfully"
        })
      } else {
        throw new Error(response.error || "Failed to delete sub-area")
      }
    } catch (error) {
      console.error("Error deleting sub-area:", error)
      toast({
        title: "Error",
        description: "Failed to delete sub-area",
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
        toast({
          title: "Success",
          description: "Audio configuration updated successfully",
        });
        console.log("Audio config updated successfully");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update audio configuration",
          variant: "destructive",
        });
        console.error("Failed to update audio config:", response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update audio configuration",
        variant: "destructive",
      });
      console.error("Error updating audio config:", error);
    }
  }
  const handleupdateRagConfig = async ()=>{ 
    try {
      const updatedConfig = {
        ...ragconfig,
        web: {
          ...webconfig,
        }
      };
      setRagConfig(updatedConfig);
      const response = await apiClient.updateRagConfig(updatedConfig);
      if (response.data) {
        toast({
          title: "Success",
          description: "Rag configuration updated successfully",
        });
        console.log("Rag config updated successfully");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update rag configuration",
          variant: "destructive",
        });
        console.error("Failed to update rag  config:", response.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rag configuration",
        variant: "destructive",
      });
      console.error("Error updating rag config:", error);
    }
  }
  // Render icon component dynamically
  const renderIcon = (iconName: string, size: number = 16) => {
    // Check if the icon exists in our IconMap
    if (IconMap[iconName]) {
      const IconComponent = IconMap[iconName];
      return <IconComponent className={`w-${size/4} h-${size/4}`} />;
    }
    
    // Fallback to MapPin if icon not found
    return <MapPin className={`w-${size/4} h-${size/4}`} />;
  };
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
            <>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
            <User className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="websearch" className="data-[state=active]:bg-primary/20">
            <Earth className="w-4 h-4 mr-2" />
            Web Search
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-primary/20">
            <PlugIcon className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
            </>
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
                  <img src={user.profile_image_url || "/user.png"} alt="Profile" onError={(e) => { e.currentTarget.src = "/user.png"; }} />
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
                  value={user.name || ""}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="glass border-primary/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
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
                    value={user.token || ""}
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
                  <div className="flex items-center justify-between mt-4"> 
                  <Label>API Key</Label>
                
                  <Button className="glass border-primary/30 bg-transparent"
                  onClick={()=>{generate_api_key()}}
                  >Create a new secret Key</Button>

                  </div>
                  <div>
                      <div className="flex gap-2">
                        <Input
                    type={hideapi ? 'password' : 'text'}
                    value={apikey || ""}
                    readOnly
                    className="glass border-primary/20"
                  />
                  <Button variant="outline" className="glass border-primary/30 bg-transparent" onClick={() => setHideApiKey(!hideapi)}>
                    {hideapi ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                  </Button>
                  <Button variant="outline" className="glass border-primary/30 bg-transparent" onClick={() => copyToClipboard(apikey || "")}>
                    <Copy className="w-4 h-4 mr-2" />
                  </Button>

                      </div>
                </div>
                <p className="text-xs text-muted-foreground">Keep your API key secure and never share it publicly</p>
                      </>
                    )}
                
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleUpdateProfile} 
                disabled={!isUserDataModified()}
                className="neon-glow"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
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
                  <Select onValueChange={(value) =>(setSttEngine(value))} defaultValue={audioconfig.stt.ENGINE || "whisper"}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue  placeholder="Select Engine"/>
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
                      <SelectItem value="whisper">Whisper(Local)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="azure">Azure AI Speech</SelectItem>
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
                      {sttengine== "azure" && <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Label className="flex space-y-2 font-medium mb-4" >API Key</Label>
                          </div>
                          <div className="flex space-x-2">
                        <Input
                        type={hideapi ? "password" : "text"}
                        onChange={(e)=>{
                          setAudioConfig({
                            ...audioconfig,
                            stt: {
                              ...audioconfig.stt,
                              API_KEY: e.target.value
                            }
                          })
                        }}
                        />  
                        
                        <Button onClick={()=>{setHideApiKey(!hideapi)}}>
                          {hideapi ? <Eye/> : <EyeOff/>}
                        </Button>
                        </div>
                        <div>
                        <div className=" mb-1.5 text-xs font-medium">Azure Region</div>
                        <div className="flex w-full">
                          <div className="flex-1">
                            <Input
                              placeholder='e.g., westus (leave blank for eastus)'
                            />
                          </div>
                        </div>
                        </div>
                        <div>
                        <div className=" mb-1.5 text-xs font-medium">Language Locales</div>
                        <div className="flex w-full">
                          <div className="flex-1">
                            <Input
                              placeholder='e.g., en-US,ja-JP (leave blank for auto-detect)'
                            />
                          </div>
                        </div>
                      </div>
                      <div>
							<div className=" mb-1.5 text-xs font-medium">Endpoint URL</div>
							<div className="flex w-full">
								<div className="flex-1">
									<Input
										placeholder='(leave blank for to use commercial endpoint)'
									/>
								</div>
							</div>
						</div>

						<div>
							<div className=" mb-1.5 text-xs font-medium">Max Speakers</div>
							<div className="flex w-full">
								<div className="flex-1">
									<Input
										placeholder='e.g., 3, 4, 5 (leave blank for default)'
									/>
								</div>
							</div>
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
                      <Select onValueChange={(value) => setTtsEngine(value)} defaultValue={audioconfig.tts.ENGINE}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Select Engine" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">
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
          <div className="space-y-8">
            {/* Floors Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Floors
                </h3>
                <Dialog open={isAddFloorDialogOpen} onOpenChange={setIsAddFloorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Floor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Floor</DialogTitle>
                      <DialogDescription>
                        Create a new floor for your home structure
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="floor-name">Floor Name *</Label>
                        <Input
                          id="floor-name"
                          value={newFloor.name}
                          onChange={(e) => setNewFloor({...newFloor, name: e.target.value})}
                          placeholder="e.g., Ground Floor, First Floor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor-level">Level</Label>
                        <Input
                          id="floor-level"
                          type="number"
                          value={newFloor.level}
                          onChange={(e) => setNewFloor({...newFloor, level: parseInt(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor-icon">Icon</Label>
                        <Select
                          value={newFloor.icon}
                          onValueChange={(value) => setNewFloor({...newFloor, icon: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COMMON_ICONS.map((iconName) => (
                              <SelectItem key={iconName} value={iconName} className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {renderIcon(iconName, 16)}
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor-aliases">Aliases (comma separated)</Label>
                        <Input
                          id="floor-aliases"
                          value={newFloor.aliases}
                          onChange={(e) => setNewFloor({...newFloor, aliases: e.target.value})}
                          placeholder="e.g., First Floor, Ground Level"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddFloorDialogOpen(false);
                          setEditingFloor(null);
                          setNewFloor({ name: "", level: 0, icon: "", aliases: "" });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={editingFloor ? handleUpdateFloor : handleAddFloor}>
                          {editingFloor ? "Update Floor" : "Add Floor"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {floors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floors.map((floor) => (
                    <div key={floor.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {renderIcon(floor.icon || "Building", 16)}
                        <div>
                          <div className="font-medium">{floor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Level: {floor.level} {floor.aliases && floor.aliases.length > 0 ? `(${floor.aliases.join(", ")})` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingFloor(floor)
                            setNewFloor({ 
                              name: floor.name, 
                              level: floor.level || 0, 
                              icon: floor.icon || "", 
                              aliases: floor.aliases ? floor.aliases.join(", ") : "" 
                            })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteFloor(floor.id)}
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
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Areas
                </h3>
                <Dialog open={isAddAreaDialogOpen} onOpenChange={setIsAddAreaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Area
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Area</DialogTitle>
                      <DialogDescription>
                        Create a new area within a floor
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="area-name">Area Name *</Label>
                        <Input
                          id="area-name"
                          value={newArea.name}
                          onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                          placeholder="e.g., Living Room, Kitchen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-floor">Floor *</Label>
                        <Select
                          value={newArea.floor_id.toString()}
                          onValueChange={(value) => setNewArea({...newArea, floor_id: parseInt(value) || 0})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a floor" />
                          </SelectTrigger>
                          <SelectContent>
                            {floors.map((floor) => (
                              <SelectItem key={floor.id} value={floor.id.toString()}>
                                {floor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-icon">Icon</Label>
                        <Select
                          value={newArea.icon}
                          onValueChange={(value) => setNewArea({...newArea, icon: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COMMON_ICONS.map((iconName) => (
                              <SelectItem key={iconName} value={iconName} className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {renderIcon(iconName, 16)}
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          {newArea.icon && renderIcon(newArea.icon, 48)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-label">Label</Label>
                        <Input
                          id="area-label"
                          value={newArea.label}
                          onChange={(e) => setNewArea({...newArea, label: e.target.value})}
                          placeholder="e.g., Main Living Area"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-image">Image URL</Label>
                        <Input
                          id="area-image"
                          value={newArea.image}
                          onChange={(e) => setNewArea({...newArea, image: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area-aliases">Aliases (comma separated)</Label>
                        <Input
                          id="area-aliases"
                          value={newArea.aliases}
                          onChange={(e) => setNewArea({...newArea, aliases: e.target.value})}
                          placeholder="e.g., Family Room, Lounge"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddAreaDialogOpen(false);
                          setEditingArea(null);
                          setNewArea({ name: "", floor_id: 0, icon: "", label: "", image: "", aliases: "" });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={editingArea ? handleUpdateArea : handleAddArea}>
                          {editingArea ? "Update Area" : "Add Area"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <div key={area.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {renderIcon(area.icon || "MapPin", 16)}
                        <div>
                          <div className="font-medium">{area.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {area.label && `Label: ${area.label}`}
                            {area.image && ` | Image: ${area.image.substring(0, 20)}...`}
                            {area.aliases && area.aliases.length > 0 && ` | Aliases: ${area.aliases.join(", ")}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingArea(area)
                            setNewArea({ 
                              name: area.name, 
                              floor_id: area.floor_id || 0,
                              icon: area.icon || "", 
                              label: area.label || "",
                              image: area.image || "",
                              aliases: area.aliases ? area.aliases.join(", ") : ""
                            })
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
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Sub-Areas
                </h3>
                <Dialog open={isAddSubAreaDialogOpen} onOpenChange={setIsAddSubAreaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sub-Area
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Sub-Area</DialogTitle>
                      <DialogDescription>
                        Create a new sub-area within an area
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subarea-name">Sub-Area Name *</Label>
                        <Input
                          id="subarea-name"
                          value={newSubArea.name}
                          onChange={(e) => setNewSubArea({...newSubArea, name: e.target.value})}
                          placeholder="e.g., Couch Area, Dining Table"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subarea-area">Area *</Label>
                        <Select
                          value={newSubArea.area_id.toString()}
                          onValueChange={(value) => setNewSubArea({...newSubArea, area_id: parseInt(value) || 0})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an area" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subarea-icon">Icon</Label>
                        <Select
                          value={newSubArea.icon}
                          onValueChange={(value) => setNewSubArea({...newSubArea, icon: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COMMON_ICONS.map((iconName) => (
                              <SelectItem key={iconName} value={iconName} className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {renderIcon(iconName, 16)}
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          {newSubArea.icon && renderIcon(newSubArea.icon, 48)}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddSubAreaDialogOpen(false);
                          setEditingSubArea(null);
                          setNewSubArea({ name: "", area_id: 0, icon: "" });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={editingSubArea ? handleUpdateSubArea : handleAddSubArea}>
                          {editingSubArea ? "Update Sub-Area" : "Add Sub-Area"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {subAreas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subAreas.map((subArea) => (
                    <div key={subArea.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {renderIcon(subArea.icon || "Layers", 16)}
                        <div>
                          <div className="font-medium">{subArea.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Area ID: {subArea.area_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingSubArea(subArea)
                            setNewSubArea({ 
                              name: subArea.name, 
                              area_id: subArea.area_id,
                              icon: subArea.icon || ""
                            })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteSubArea(subArea.id)}
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
        {/* Web Search Tab */}
        <TabsContent value="websearch" className="space-y-6">
          <Card className="glass border-primary/20 p-6">
            <h2 className="text-xl font-semibold mb-6">Web Search Configuration</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="websearch-toggle">Enable Web Search</Label>
                  <Switch 
                    id="websearch-toggle"
                    checked={isWebsearchEnabled} 
                    onCheckedChange={setWebsearchEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Web Search Engine</Label>
                  <Select 
                    value={websearchEngine || "searxng"} 
                    onValueChange={setWebsearchEngine}
                  >
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Select Engine" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-primary/20">

                      <SelectItem value="*">Select the Engine</SelectItem>
                      {webSearchEngines.map((engine) => (
                        <SelectItem key={engine} value={engine}>
                          {engine.charAt(0).toUpperCase() + engine.slice(1).replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select which search engine to use for web searches
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="bypass-toggle">Bypass Embedding and Retrieval</Label>
                  <Switch 
                    id="bypass-toggle"
                    checked={byPassEmbedding} 
                    onCheckedChange={setByPassEmbedding}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable to inject entire content as context for comprehensive processing (recommended for complex queries)
                </p>
              </div>
              
              {websearchEngine!=="*" && (
                <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Engine Specific Settings</h3>
                <hr className="border-primary/20 mb-4"/>
                {websearchEngine === "ollama_cloud" && (
                  <>
                  <div className="mb-2.5 flex w-full flex-col">
								<div>
									<div className=" self-center text-xs font-medium mb-1">
										<Label>Ollama Cloud API Key</Label>
									</div>

									<div className="flex w-full">
										<div className="flex items-center space-y-2 justify-between">
											<Input
												placeholder={'Enter Ollama Cloud API Key'}
												onChange={(e) => setWebConfig({ ...webconfig, OLLAMA_CLOUD_WEB_SEARCH_API_KEY: e.target.value })}
                        type={hideapi ? "password" : "text"}
                        about="Enter Ollama Cloud API Key"
											/>
                      <Button onClick={() => setHideApiKey(!hideapi)}>{hideapi ? <Eye/> : <EyeOff/>}</Button>
										</div>
									</div>
								</div>
							</div>
                  </>
                )}
                {websearchEngine === "searxng" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Searxng Query URL</Label>
                      <Input 
                        placeholder="Enter Searxng Query URL"
                        value={webconfig.SEARXNG_QUERY_URL || ""}
                        onChange={(e) => setWebConfig({
                          
                            ...webconfig,
                            SEARXNG_QUERY_URL: e.target.value
                      
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {websearchEngine === "google_pse" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Google PSE API Key</Label>
                      <Input 
                        type={hideapi ? "password" : "text"}
                        placeholder="Enter Google PSE API Key"
                        value={ragconfig.web?.GOOGLE_PSE_API_KEY || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            GOOGLE_PSE_API_KEY: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Google PSE Engine ID</Label>
                      <Input 
                        placeholder="Enter Google PSE Engine ID"
                        value={ragconfig.web?.GOOGLE_PSE_ENGINE_ID || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            GOOGLE_PSE_ENGINE_ID: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {websearchEngine === "brave" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brave Search API Key</Label>
                      <Input 
                        type={hideapi ? "password" : "text"}
                        placeholder="Enter Brave Search API Key"
                        value={ragconfig.web?.BRAVE_SEARCH_API_KEY || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            BRAVE_SEARCH_API_KEY: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {websearchEngine === "tavily" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tavily API Key</Label>
                      <Input 
                        type={hideapi ? "password" : "text"}
                        placeholder="Enter Tavily API Key"
                        value={ragconfig.web?.TAVILY_API_KEY || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            TAVILY_API_KEY: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {websearchEngine === "bing" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bing Search V7 Endpoint</Label>
                      <Input 
                        placeholder="Enter Bing Search V7 Endpoint"
                        value={ragconfig.web?.BING_SEARCH_V7_ENDPOINT || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            BING_SEARCH_V7_ENDPOINT: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bing Search V7 Subscription Key</Label>
                      <Input 
                        type={hideapi ? "password" : "text"}
                        placeholder="Enter Bing Search V7 Subscription Key"
                        value={ragconfig.web?.BING_SEARCH_V7_SUBSCRIPTION_KEY || ""}
                        onChange={(e) => setRagConfig({
                          ...ragconfig,
                          web: {
                            ...ragconfig.web,
                            BING_SEARCH_V7_SUBSCRIPTION_KEY: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
                {websearchEngine === 'perplexity_search' &&
              <>
              <div className="mb-2.5 flex w-full flex-col">
								<div>
									<div className=" self-center text-xs font-medium mb-1">
										<Label>Perplexity Search API URL</Label>
									</div>

									<div className="flex w-full">
										<div className="flex-1">
											<Input
												type="text"
												placeholder='Enter Perplexity Search API URL'
												value={webconfig.PERPLEXITY_SEARCH_API_URL}
												autoComplete="off"
                        onChange={(e) => setWebConfig({
                          ...webconfig,
                          PERPLEXITY_SEARCH_API_URL: e.target.value
                        })}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="mb-2.5 flex w-full flex-col">
								<div>
									<div className=" self-center text-xs font-medium mb-1">
										<Label>Perplexity API Key</Label>
									</div>

									<div className="flex w-full">
										<div className="flex items-center space-y-2 justify-between">
									

                        <Input type={hideapi ? "password" : "text"}
												placeholder='Enter Perplexity API Key'
												value={webconfig.PERPLEXITY_API_KEY}
												onChange={(e) => setWebConfig({
													...webconfig,
													PERPLEXITY_API_KEY: e.target.value
												})}
											/>
											<Button onClick={() => setHideApiKey(!hideapi)}>{hideapi ? <Eye/> : <EyeOff/>}</Button>
										</div>
									</div>
								</div>
							</div>
              
              </>
}
              </div>
              )}
              {isWebsearchEnabled && (
              <>
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>
                <hr className="border-primary/20 mb-4"/>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search Result Count</Label>
                    <Input 
                      type="number"
                      placeholder="Enter number of search results to return"
                      value={ragconfig.web?.WEB_SEARCH_RESULT_COUNT || ""}
                      onChange={(e) => setRagConfig({
                        ...ragconfig,
                        web: {
                          ...ragconfig.web,
                          WEB_SEARCH_RESULT_COUNT: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of search results to include in the context
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Domain Filter List</Label>
                    <Input 
                      placeholder="Enter domains separated by commas (e.g., example.com,site.org,!excludedsite.com)"
                      value={ragconfig.web?.WEB_SEARCH_DOMAIN_FILTER_LIST || ""}
                      onChange={(e) => setRagConfig({
                        ...ragconfig,
                        web: {
                          ...ragconfig.web,
                          WEB_SEARCH_DOMAIN_FILTER_LIST: e.target.value
                        }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include or exclude specific domains from search results
                    </p>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleupdateRagConfig} className="neon-glow">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsManager />
        </TabsContent>
      </Tabs>
      
    </div>
  )
}