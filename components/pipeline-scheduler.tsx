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
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Plus,
  Zap,
  History
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "inactive" | "running" | "error";
  lastRun?: string;
  nextRun?: string;
  executions: number;
  successRate: number;
}

interface ScheduledTask {
  id: string;
  pipelineId: string;
  pipelineName: string;
  scheduleType: "cron" | "interval" | "daily" | "weekly";
  scheduleValue: string; // cron expression or interval in seconds
  enabled: boolean;
  lastExecution?: string;
  nextExecution?: string;
  createdAt: string;
  updatedAt: string;
}

export function PipelineScheduler() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [newTask, setNewTask] = useState({
    pipelineId: "",
    scheduleType: "daily" as "cron" | "interval" | "daily" | "weekly",
    scheduleValue: "",
    enabled: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pipelines
      const pipelinesResponse = await apiClient.getPipelinesList();
      if (pipelinesResponse.success && pipelinesResponse.data) {
        // Transform pipeline data
        const transformedPipelines = Array.isArray(pipelinesResponse.data) 
          ? pipelinesResponse.data.map((pipeline: any) => ({
              id: pipeline.id,
              name: pipeline.name || pipeline.id,
              description: pipeline.description || "No description",
              type: pipeline.type || "generic",
              status: "active",
              executions: Math.floor(Math.random() * 100),
              successRate: 85 + Math.random() * 14
            }))
          : [];
          
        setPipelines(transformedPipelines);
      }
      
      // Mock scheduled tasks data (in a real implementation, this would come from the backend)
      const mockTasks: ScheduledTask[] = [
        {
          id: "task-1",
          pipelineId: "pipeline-1",
          pipelineName: "Data Processing Pipeline",
          scheduleType: "daily",
          scheduleValue: "0 2 * * *", // 2 AM daily
          enabled: true,
          lastExecution: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextExecution: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "task-2",
          pipelineId: "pipeline-2",
          pipelineName: "Report Generation",
          scheduleType: "weekly",
          scheduleValue: "0 0 * * 1", // Every Monday at midnight
          enabled: true,
          lastExecution: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextExecution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "task-3",
          pipelineId: "pipeline-3",
          pipelineName: "Backup Pipeline",
          scheduleType: "interval",
          scheduleValue: "3600", // Every hour
          enabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setScheduledTasks(mockTasks);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pipeline data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    if (!newTask.pipelineId) {
      toast({
        title: "Error",
        description: "Please select a pipeline",
        variant: "destructive"
      });
      return;
    }

    const pipeline = pipelines.find(p => p.id === newTask.pipelineId);
    if (!pipeline) return;

    const task: ScheduledTask = {
      id: `task-${Date.now()}`,
      pipelineId: newTask.pipelineId,
      pipelineName: pipeline.name,
      scheduleType: newTask.scheduleType,
      scheduleValue: newTask.scheduleValue,
      enabled: newTask.enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setScheduledTasks([...scheduledTasks, task]);
    setIsCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: "Success",
      description: "Scheduled task created successfully"
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const updatedTasks = scheduledTasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    );
    
    setScheduledTasks(updatedTasks);
    setIsEditDialogOpen(false);
    setEditingTask(null);
    
    toast({
      title: "Success",
      description: "Scheduled task updated successfully"
    });
  };

  const handleDeleteTask = (id: string) => {
    setScheduledTasks(scheduledTasks.filter(task => task.id !== id));
    
    toast({
      title: "Success",
      description: "Scheduled task deleted successfully"
    });
  };

  const toggleTaskStatus = (id: string) => {
    const updatedTasks = scheduledTasks.map(task => 
      task.id === id ? { ...task, enabled: !task.enabled } : task
    );
    
    setScheduledTasks(updatedTasks);
    
    toast({
      title: "Success",
      description: `Task ${updatedTasks.find(t => t.id === id)?.enabled ? 'enabled' : 'disabled'} successfully`
    });
  };

  const resetForm = () => {
    setNewTask({
      pipelineId: "",
      scheduleType: "daily",
      scheduleValue: "",
      enabled: true
    });
  };

  const getScheduleDescription = (task: ScheduledTask) => {
    switch (task.scheduleType) {
      case "daily":
        return "Runs daily";
      case "weekly":
        return "Runs weekly";
      case "interval":
        const seconds = parseInt(task.scheduleValue);
        if (seconds >= 3600) {
          return `Runs every ${Math.floor(seconds / 3600)} hours`;
        } else if (seconds >= 60) {
          return `Runs every ${Math.floor(seconds / 60)} minutes`;
        } else {
          return `Runs every ${seconds} seconds`;
        }
      case "cron":
        return `Cron: ${task.scheduleValue}`;
      default:
        return "Scheduled task";
    }
  };

  const formatNextRun = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return "Overdue";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `in ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `in ${diffMinutes} minutes`;
    }
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
          <h1 className="text-3xl font-bold">Pipeline Scheduler</h1>
          <p className="text-muted-foreground">Automate and schedule your pipeline executions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Pipeline</DialogTitle>
              <DialogDescription>
                Create a scheduled task to automatically run a pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline-select">Select Pipeline</Label>
                <Select 
                  value={newTask.pipelineId} 
                  onValueChange={(value) => setNewTask({...newTask, pipelineId: value})}
                >
                  <SelectTrigger id="pipeline-select">
                    <SelectValue placeholder="Select a pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select 
                  value={newTask.scheduleType} 
                  onValueChange={(value) => setNewTask({...newTask, scheduleType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="interval">Interval</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schedule-value">
                  {newTask.scheduleType === "cron" ? "Cron Expression" : 
                   newTask.scheduleType === "interval" ? "Interval (seconds)" : 
                   newTask.scheduleType === "daily" ? "Time (24h format)" : 
                   "Day and Time"}
                </Label>
                <Input
                  id="schedule-value"
                  value={newTask.scheduleValue}
                  onChange={(e) => setNewTask({...newTask, scheduleValue: e.target.value})}
                  placeholder={
                    newTask.scheduleType === "cron" ? "e.g., 0 2 * * *" : 
                    newTask.scheduleType === "interval" ? "e.g., 3600" : 
                    newTask.scheduleType === "daily" ? "e.g., 02:00" : 
                    "e.g., Monday 02:00"
                  }
                />
                {newTask.scheduleType === "cron" && (
                  <p className="text-xs text-muted-foreground">
                    Use cron syntax: minute hour day month dayOfWeek
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newTask.enabled}
                  onChange={(e) => setNewTask({...newTask, enabled: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="enabled">Enable this schedule</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledTasks.length}</div>
            <p className="text-xs text-muted-foreground">Active scheduled tasks</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledTasks.filter(t => t.enabled).length}</div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelines.length}</div>
            <p className="text-xs text-muted-foreground">Available pipelines</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheduledTasks.reduce((acc, task) => acc + (task.executions || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total executions</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Tasks Table */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>Manage your automated pipeline executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Pipeline</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Schedule</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Next Run</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledTasks.map((task) => {
                  const pipeline = pipelines.find(p => p.id === task.pipelineId);
                  return (
                    <tr key={task.id} className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium">{task.pipelineName}</div>
                        <div className="text-sm text-muted-foreground">{pipeline?.description}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{getScheduleDescription(task)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm">
                          {task.nextExecution ? formatNextRun(task.nextExecution) : "Not scheduled"}
                        </div>
                        {task.nextExecution && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(task.nextExecution).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={task.enabled ? "default" : "secondary"}
                          className={task.enabled ? "bg-green-500/20 text-green-700 border-green-500/30" : ""}
                        >
                          {task.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleTaskStatus(task.id)}
                          >
                            {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {scheduledTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 px-2 text-center text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                      <p>No scheduled tasks found</p>
                      <p className="text-sm mt-1">Create your first scheduled pipeline execution</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Task</DialogTitle>
            <DialogDescription>
              Modify your scheduled pipeline execution
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pipeline">Pipeline</Label>
                <div className="p-3 bg-muted rounded-md">
                  {editingTask.pipelineName}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select 
                  value={editingTask.scheduleType} 
                  onValueChange={(value) => setEditingTask({...editingTask, scheduleType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="interval">Interval</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-schedule-value">
                  {editingTask.scheduleType === "cron" ? "Cron Expression" : 
                   editingTask.scheduleType === "interval" ? "Interval (seconds)" : 
                   editingTask.scheduleType === "daily" ? "Time (24h format)" : 
                   "Day and Time"}
                </Label>
                <Input
                  id="edit-schedule-value"
                  value={editingTask.scheduleValue}
                  onChange={(e) => setEditingTask({...editingTask, scheduleValue: e.target.value})}
                  placeholder={
                    editingTask.scheduleType === "cron" ? "e.g., 0 2 * * *" : 
                    editingTask.scheduleType === "interval" ? "e.g., 3600" : 
                    editingTask.scheduleType === "daily" ? "e.g., 02:00" : 
                    "e.g., Monday 02:00"
                  }
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-enabled"
                  checked={editingTask.enabled}
                  onChange={(e) => setEditingTask({...editingTask, enabled: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="edit-enabled">Enable this schedule</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}