"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Memory {
  id: string;
  user_id: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Fetch all memories
  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getMemories();
      
      if (response.success && response.data) {
        // Sort memories by updated_at in descending order (newest first)
        const sortedMemories = response.data.sort((a, b) => b.updated_at - a.updated_at);
        setMemories(sortedMemories);
      } else {
        setError(response.error || "Failed to fetch memories");
        toast({
          title: "Error",
          description: response.error || "Failed to fetch memories",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching memories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new memory
  const createMemory = async () => {
    if (!newMemoryContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Memory content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiClient.createMemory({ content: newMemoryContent });
      
      if (response.success && response.data) {
        setMemories([response.data, ...memories]);
        setNewMemoryContent("");
        toast({
          title: "Success",
          description: "Memory created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create memory",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating memory",
        variant: "destructive",
      });
    }
  };

  // Update a memory
  const updateMemory = async (id: string) => {
    if (!editingContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Memory content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiClient.updateMemory(id, { content: editingContent });
      
      if (response.success && response.data) {
        setMemories(memories.map(memory => 
          memory.id === id ? { ...memory, ...response.data, content: editingContent } : memory
        ));
        setEditingMemoryId(null);
        setEditingContent("");
        toast({
          title: "Success",
          description: "Memory updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update memory",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating memory",
        variant: "destructive",
      });
    }
  };

  // Delete a memory
  const deleteMemory = async (id: string) => {
    try {
      const response = await apiClient.deleteMemory(id);
      
      if (response.success) {
        setMemories(memories.filter(memory => memory.id !== id));
        toast({
          title: "Success",
          description: "Memory deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete memory",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting memory",
        variant: "destructive",
      });
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Initialize component
  useEffect(() => {
    fetchMemories();
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold neon-text">Memory Management</h1>
              <p className="text-muted-foreground">
                Store and manage your AI memories
              </p>
            </div>
            <Button 
              onClick={fetchMemories} 
              disabled={loading}
              variant="outline"
              className="glass border-primary/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Add New Memory Card */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Add New Memory
              </CardTitle>
              <CardDescription>
                Create a new memory entry for your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your memory content here..."
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                rows={4}
                className="min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={createMemory}
                  disabled={!newMemoryContent.trim() || loading}
                  className="glass"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Memory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="glass border-destructive/50 bg-destructive/10">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Error Loading Memories</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Memories List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Memories</h2>
            
            {loading ? (
              // Loading Skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="glass border-primary/20 p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded-md w-1/4 animate-pulse"></div>
                      <div className="h-20 bg-muted rounded-md animate-pulse"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-muted rounded-md w-1/6 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded-md w-1/6 animate-pulse"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : memories.length === 0 ? (
              // Empty State
              <Card className="glass border-primary/20 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 glass rounded-full border border-primary/20">
                    <AlertCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">No Memories Found</h3>
                    <p className="text-muted-foreground mt-2">
                      Create your first memory using the form above
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              // Memories List
              <div className="space-y-4">
                {memories.map((memory) => (
                  <Card key={memory.id} className="glass border-primary/20">
                    <CardContent className="p-6">
                      {editingMemoryId === memory.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={4}
                            className="min-h-[120px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingMemoryId(null);
                                setEditingContent("");
                              }}
                              className="glass border-primary/30"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              onClick={() => updateMemory(memory.id)}
                              className="glass"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-4">
                          <p className="whitespace-pre-wrap">{memory.content}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
                            <div className="flex flex-wrap gap-4">
                              <span>Created: {formatTimestamp(memory.created_at)}</span>
                              <span>Updated: {formatTimestamp(memory.updated_at)}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingMemoryId(memory.id);
                                  setEditingContent(memory.content);
                                }}
                                className="glass border-primary/30"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMemory(memory.id)}
                                className="glass border-destructive/30 hover:border-destructive/50"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}