"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Move,
  Home,
  DoorOpen,
  Volume2,
  Tv,
  Coffee,
  Shield
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Entity {
  entity_id: string;
  name: string;
  domain: string;
  state: string;
  icon?: string;
  area_id?: string;
}

interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  entities: string[]; // entity_ids
  icon: string;
  createdAt: string;
  updatedAt: string;
}

interface Area {
  id: number;
  name: string;
  icon?: string;
}

export function DeviceGroupingManager() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    entities: [] as string[],
    icon: "Home"
  });
  const [selectedEntities, setSelectedEntities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch entities
      const entitiesResponse = await apiClient.getHomeAssistantEntitiesRegistry();
      if (entitiesResponse.success && entitiesResponse.data) {
        setEntities(entitiesResponse.data);
      }
      
      // Fetch areas
      const areasResponse = await apiClient.getHomeAssistantAreas();
      if (areasResponse.success && areasResponse.data) {
        setAreas(areasResponse.data);
      }
      
      // Mock groups data (in a real implementation, this would come from the backend)
      const mockGroups: DeviceGroup[] = [
        {
          id: "group-1",
          name: "Living Room",
          description: "All devices in the living room area",
          entities: ["light.living_room_main", "switch.tv_power", "media_player.living_room_tv"],
          icon: "Home",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "group-2",
          name: "Security System",
          description: "All security-related devices",
          entities: ["binary_sensor.front_door", "binary_sensor.back_door", "camera.front_door"],
          icon: "Shield",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "group-3",
          name: "Kitchen Appliances",
          description: "Kitchen smart devices",
          entities: ["switch.coffee_maker", "light.kitchen_counter", "sensor.kitchen_temperature"],
          icon: "Coffee",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setGroups(mockGroups);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch device data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (domain: string) => {
    switch (domain) {
      case "light": return <Lightbulb className="w-4 h-4" />;
      case "switch": return <Power className="w-4 h-4" />;
      case "sensor": return <Thermometer className="w-4 h-4" />;
      case "binary_sensor": return <Activity className="w-4 h-4" />;
      case "media_player": return <Tv className="w-4 h-4" />;
      case "camera": return <Activity className="w-4 h-4" />;
      case "lock": return <Shield className="w-4 h-4" />;
      case "cover": return <DoorOpen className="w-4 h-4" />;
      case "speaker": return <Volume2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case "Home": return <Home className="w-5 h-5" />;
      case "Shield": return <Shield className="w-5 h-5" />;
      case "Coffee": return <Coffee className="w-5 h-5" />;
      case "Tv": return <Tv className="w-5 h-5" />;
      case "Lightbulb": return <Lightbulb className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
    }
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    const group: DeviceGroup = {
      id: `group-${Date.now()}`,
      name: newGroup.name,
      description: newGroup.description,
      entities: Object.keys(selectedEntities).filter(id => selectedEntities[id]),
      icon: newGroup.icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGroups([...groups, group]);
    setIsCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: "Success",
      description: "Device group created successfully"
    });
  };

  const handleUpdateGroup = () => {
    if (!editingGroup || !editingGroup.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    const updatedGroups = groups.map(group => 
      group.id === editingGroup.id ? editingGroup : group
    );
    
    setGroups(updatedGroups);
    setIsEditDialogOpen(false);
    setEditingGroup(null);
    
    toast({
      title: "Success",
      description: "Device group updated successfully"
    });
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
    
    toast({
      title: "Success",
      description: "Device group deleted successfully"
    });
  };

  const resetForm = () => {
    setNewGroup({
      name: "",
      description: "",
      entities: [],
      icon: "Home"
    });
    setSelectedEntities({});
  };

  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntities(prev => ({
      ...prev,
      [entityId]: !prev[entityId]
    }));
  };

  const toggleEntityInGroup = (entityId: string) => {
    if (!editingGroup) return;
    
    setEditingGroup({
      ...editingGroup,
      entities: editingGroup.entities.includes(entityId)
        ? editingGroup.entities.filter(id => id !== entityId)
        : [...editingGroup.entities, entityId]
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Device Grouping</h1>
          <p className="text-muted-foreground">Organize and manage your smart home devices in groups</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Device Group</DialogTitle>
              <DialogDescription>
                Organize your smart home devices into logical groups
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="e.g., Living Room, Security System"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="Description of this group"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Group Icon</Label>
                <Select value={newGroup.icon} onValueChange={(value) => setNewGroup({...newGroup, icon: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Shield">Shield</SelectItem>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Tv">TV</SelectItem>
                    <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Select Devices</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {entities.map((entity) => (
                    <div 
                      key={entity.entity_id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                        selectedEntities[entity.entity_id] ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => toggleEntitySelection(entity.entity_id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getEntityIcon(entity.domain)}
                        <span className="text-sm">{entity.name}</span>
                      </div>
                      <Badge variant="secondary">{entity.domain}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="glass border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getGroupIcon(group.icon)}
                </div>
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="text-xs">{group.description}</CardDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingGroup(group);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Devices</span>
                  <Badge variant="secondary">{group.entities.length}</Badge>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {entities
                    .filter(entity => group.entities.includes(entity.entity_id))
                    .map(entity => (
                      <div key={entity.entity_id} className="flex items-center gap-2 text-sm">
                        {getEntityIcon(entity.domain)}
                        <span className="truncate">{entity.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {entity.domain}
                        </Badge>
                      </div>
                    ))}
                  
                  {group.entities.length === 0 && (
                    <p className="text-muted-foreground text-sm">No devices in this group</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Device Group</DialogTitle>
            <DialogDescription>
              Modify your device group settings
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                  placeholder="e.g., Living Room, Security System"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-group-description">Description</Label>
                <Input
                  id="edit-group-description"
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                  placeholder="Description of this group"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Group Icon</Label>
                <Select value={editingGroup.icon} onValueChange={(value) => setEditingGroup({...editingGroup, icon: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Shield">Shield</SelectItem>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Tv">TV</SelectItem>
                    <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Select Devices</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {entities.map((entity) => (
                    <div 
                      key={entity.entity_id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                        editingGroup.entities.includes(entity.entity_id) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => toggleEntityInGroup(entity.entity_id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getEntityIcon(entity.domain)}
                        <span className="text-sm">{entity.name}</span>
                      </div>
                      <Badge variant="secondary">{entity.domain}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>
              Update Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}