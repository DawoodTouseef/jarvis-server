"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Database, 
  Upload, 
  FileText, 
  Folder, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  Loader2, 
  Plus, 
  RefreshCw,
  Edit,
  Save,
  X
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  apiClient, 
  KnowledgeBase as KnowledgeBaseType, 
  KnowledgeBaseCreate, 
  KnowledgeBaseUpdate,
  KnowledgeBaseFile
} from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Document {
  id: string
  name: string
  type: string
  size: string
  folder: string
  uploadedAt: Date
  status: "indexed" | "processing" | "failed"
}

export function KnowledgeManagement() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<KnowledgeBaseType | null>(null)
  const [newKnowledgeBase, setNewKnowledgeBase] = useState({ name: "", description: "" })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getKnowledgeBases()
      if (res.success && res.data) {
        setKnowledgeBases(res.data)
      } else {
        throw new Error(res.error || "Failed to fetch knowledge bases")
      }
    } catch (error) {
      console.error("Error fetching knowledge bases:", error)
      toast({
        title: "Error",
        description: "Failed to fetch knowledge bases",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  // Flatten files from all knowledge bases into a single documents array
  const allDocuments: Document[] = knowledgeBases.flatMap(kb => 
    (kb.files || []).map(file => ({
      id: file.id,
      name: file.meta?.name || file.id,
      type: file.meta?.content_type || "unknown",
      size: formatFileSize(file.meta?.size || 0),
      folder: kb.name,
      uploadedAt: new Date(file.created_at * 1000),
      status: "indexed" as const
    }))
  )

  const filteredDocuments = allDocuments.filter((doc) => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateKnowledgeBase = async () => {
    try {
      if (!newKnowledgeBase.name.trim()) {
        toast({
          title: "Error",
          description: "Knowledge base name is required",
          variant: "destructive"
        })
        return
      }

      const data: KnowledgeBaseCreate = {
        name: newKnowledgeBase.name,
        description: newKnowledgeBase.description
      }

      const res = await apiClient.createKnowledgeBase(data)
      if (res.success && res.data) {
        // Refresh the list
        await fetchKnowledgeBases()
        setNewKnowledgeBase({ name: "", description: "" })
        setIsCreateDialogOpen(false)
        toast({
          title: "Success",
          description: "Knowledge base created successfully"
        })
      } else {
        throw new Error(res.error || "Failed to create knowledge base")
      }
    } catch (error) {
      console.error("Error creating knowledge base:", error)
      toast({
        title: "Error",
        description: "Failed to create knowledge base",
        variant: "destructive"
      })
    }
  }

  const handleUpdateKnowledgeBase = async () => {
    try {
      if (!editingKnowledgeBase) return
      
      if (!editingKnowledgeBase.name.trim()) {
        toast({
          title: "Error",
          description: "Knowledge base name is required",
          variant: "destructive"
        })
        return
      }

      const data: KnowledgeBaseUpdate = {
        name: editingKnowledgeBase.name,
        description: editingKnowledgeBase.description
      }

      const res = await apiClient.updateKnowledgeBase(editingKnowledgeBase.id, data)
      if (res.success && res.data) {
        // Refresh the list
        await fetchKnowledgeBases()
        setIsEditDialogOpen(false)
        setEditingKnowledgeBase(null)
        toast({
          title: "Success",
          description: "Knowledge base updated successfully"
        })
      } else {
        throw new Error(res.error || "Failed to update knowledge base")
      }
    } catch (error) {
      console.error("Error updating knowledge base:", error)
      toast({
        title: "Error",
        description: "Failed to update knowledge base",
        variant: "destructive"
      })
    }
  }

  const handleDeleteKnowledgeBase = async (id: string, name: string) => {
    try {
      const res = await apiClient.deleteKnowledgeBase(id)
      if (res.success) {
        // Refresh the list
        await fetchKnowledgeBases()
        toast({
          title: "Success",
          description: `Knowledge base "${name}" deleted successfully`
        })
      } else {
        throw new Error(res.error || "Failed to delete knowledge base")
      }
    } catch (error) {
      console.error("Error deleting knowledge base:", error)
      toast({
        title: "Error",
        description: "Failed to delete knowledge base",
        variant: "destructive"
      })
    }
  }

  const folders = Array.from(new Set(allDocuments.map((doc) => doc.folder)))
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">Knowledge Management</h1>
          <p className="text-muted-foreground">Manage your knowledge bases and documents</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchKnowledgeBases}
            disabled={loading}
            className="glass border-primary/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-glow">
                <Plus className="w-4 h-4 mr-2" />
                New Knowledge Base
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-primary/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="neon-text">Create Knowledge Base</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="Knowledge base name"
                    value={newKnowledgeBase.name}
                    onChange={(e) => setNewKnowledgeBase({...newKnowledgeBase, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Knowledge base description"
                    value={newKnowledgeBase.description}
                    onChange={(e) => setNewKnowledgeBase({...newKnowledgeBase, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  className="neon-glow" 
                  onClick={handleCreateKnowledgeBase}
                  disabled={uploading || !newKnowledgeBase.name.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Knowledge Bases</p>
              <p className="text-3xl font-bold mt-1">{knowledgeBases.length}</p>
            </div>
            <Folder className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-3xl font-bold mt-1">{allDocuments.length}</p>
            </div>
            <FileText className="w-8 h-8 text-secondary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Folders</p>
              <p className="text-3xl font-bold mt-1">{folders.length}</p>
            </div>
            <Database className="w-8 h-8 text-accent" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-3xl font-bold mt-1">9 GB</p>
            </div>
            <Database className="w-8 h-8 text-chart-4" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge bases or documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass border-primary/20"
          disabled={loading}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Knowledge Bases Table */}
      {!loading && (
        <Card className="glass border-primary/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Description</TableHead>
                <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Documents</TableHead>
                <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Created</TableHead>
                <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledgeBases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                    No knowledge bases found
                  </TableCell>
                </TableRow>
              ) : (
                knowledgeBases.map((kb) => (
                  <TableRow key={kb.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                    <TableCell className="p-4 font-medium">{kb.name}</TableCell>
                    <TableCell className="p-4 text-muted-foreground">{kb.description || "-"}</TableCell>
                    <TableCell className="p-4">
                      <Badge variant="secondary">
                        {(kb.files || []).length} documents
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-muted-foreground">
                      {new Date(kb.created_at * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-primary/10 h-8 w-8"
                          onClick={() => {
                            setEditingKnowledgeBase(kb)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/10 text-destructive h-8 w-8"
                          onClick={() => handleDeleteKnowledgeBase(kb.id, kb.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditingKnowledgeBase(null)
      }}>
        <DialogContent className="glass-strong border-primary/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="neon-text">Edit Knowledge Base</DialogTitle>
          </DialogHeader>
          {editingKnowledgeBase && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  placeholder="Knowledge base name"
                  value={editingKnowledgeBase.name}
                  onChange={(e) => setEditingKnowledgeBase({
                    ...editingKnowledgeBase,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Knowledge base description"
                  value={editingKnowledgeBase.description || ""}
                  onChange={(e) => setEditingKnowledgeBase({
                    ...editingKnowledgeBase,
                    description: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="neon-glow" 
              onClick={handleUpdateKnowledgeBase}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}