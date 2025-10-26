"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, Upload, FileText, Folder, Search, Trash2, Download, Eye, Loader2, Plus, Edit, Save, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { apiClient, KnowledgeBase as KnowledgeBaseType, KnowledgeBaseCreate, KnowledgeBaseUpdate } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

interface Document {
  id: string
  name: string
  type: string
  size: string
  folder: string
  uploadedAt: Date
  status: "indexed" | "processing" | "failed"
}

export function KnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>("")
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
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
      status: "indexed" as const // For now, assume all files are indexed
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

  const deleteDocument = async (id: string, knowledgeBaseId: string) => {
    try {
      // Remove file from knowledge base
      const res = await apiClient.removeFileFromKnowledgeBase(knowledgeBaseId, id)
      if (res.success) {
        // Refresh knowledge bases to show updated files
        await fetchKnowledgeBases()
        toast({
          title: "Success",
          description: "Document deleted successfully"
        })
      } else {
        throw new Error(res.error || "Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  const viewDocument = async (id: string) => {
    try {
      // Create a URL to view the file
      const baseUrl = apiClient.getBaseUrl();
      const token = apiClient.getToken();
      const url = `${baseUrl}/api/v1/files/${id}/content`;
      
      // Open in a new tab
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to view the document",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error viewing document:", error)
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive"
      })
    }
  }

  const downloadDocument = async (id: string, name: string) => {
    try {
      // Create a URL to download the file
      const baseUrl = apiClient.getBaseUrl();
      const token = apiClient.getToken();
      const url = `${baseUrl}/api/v1/files/${id}/content?attachment=true`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async () => {
    if (!selectedKnowledgeBase || !selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select a knowledge base and at least one file",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      // Upload each file
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        try {
          // First, upload the file to get its ID
          const fileResponse = await apiClient.uploadFile(file)
          console.log("File uploaded:", fileResponse)
          if (!fileResponse.success) {
            throw new Error(fileResponse.error || `Failed to upload file: ${file.name}`)
          }

          const fileId = fileResponse.data.id

          // Wait a moment for file processing to start
          // This helps avoid the "FILE_NOT_PROCESSED" error
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Then, add the file to the selected knowledge base
          console.log("Adding file to knowledge base:", selectedKnowledgeBase, fileId)
          const res = await apiClient.addFileToKnowledgeBase(selectedKnowledgeBase, fileId)
          console.log("File added to knowledge base:", res)
          if (!res.success) {
            // Handle specific error cases
            let errorMessage = res.error || `Failed to add file to knowledge base: ${file.name}`;
            
            // Check for specific error messages from the backend
            if (errorMessage.includes("NOT_FOUND")) {
              errorMessage = `Knowledge base or file not found`;
            } else if (errorMessage.includes("ACCESS_PROHIBITED")) {
              errorMessage = `You don't have permission to add files to this knowledge base`;
            } else if (errorMessage.includes("FILE_NOT_PROCESSED")) {
              errorMessage = `File is still processing. Please try again in a moment`;
            }
            
            throw new Error(errorMessage);
          }
          
          return { fileName: file.name, fileId, success: true }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
          throw error
        }
      })

      const results = await Promise.allSettled(uploadPromises)
      
      // Check results and show appropriate messages
      const successfulUploads = results.filter(result => result.status === 'fulfilled')
      const failedUploads = results.filter(result => result.status === 'rejected')
      
      if (successfulUploads.length > 0) {
        toast({
          title: "Success",
          description: `${successfulUploads.length} file(s) uploaded successfully`
        })
      }
      
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map((result: PromiseRejectedResult) => result.reason.message || "Unknown error")
        toast({
          title: "Error",
          description: `${failedUploads.length} file(s) failed to upload: ${errorMessages.join(", ")}`,
          variant: "destructive"
        })
      }
      
      // Refresh knowledge bases to show new files
      await fetchKnowledgeBases()
      
      // Reset form
      setSelectedKnowledgeBase("")
      setSelectedFiles(null)
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const folders = Array.from(new Set(allDocuments.map((doc) => doc.folder)))
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage your documents and data sources</p>
        </div>
        <div className="flex gap-2">
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
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-glow" disabled={loading}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-primary/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="neon-text">Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Knowledge Base</label>
                  <Select value={selectedKnowledgeBase} onValueChange={setSelectedKnowledgeBase}>
                    <SelectTrigger className="glass border-primary/20">
                      <SelectValue placeholder="Select a knowledge base" />
                    </SelectTrigger>
                    <SelectContent>
                      {knowledgeBases.map((kb) => (
                        <SelectItem key={kb.id} value={kb.id}>
                          {kb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Files</label>
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedFiles && selectedFiles.length > 0 
                        ? `${selectedFiles.length} file(s) selected` 
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, TXT, MD, CSV (max 10MB)</p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.csv"
                      className="hidden"
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full neon-glow" 
                  onClick={handleFileUpload}
                  disabled={uploading || !selectedKnowledgeBase || !selectedFiles || selectedFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-3xl font-bold mt-1">{allDocuments.length}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Indexed</p>
              <p className="text-3xl font-bold mt-1">{allDocuments.filter((d) => d.status === "indexed").length}</p>
            </div>
            <Database className="w-8 h-8 text-secondary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Folders</p>
              <p className="text-3xl font-bold mt-1">{folders.length}</p>
            </div>
            <Folder className="w-8 h-8 text-accent" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-3xl font-bold mt-1">9.5 GB</p>
            </div>
            <Database className="w-8 h-8 text-chart-4" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
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

      {/* Folders */}
      {!loading && (
        <div className="flex gap-2 flex-wrap">
          {folders.map((folder) => (
            <Button key={folder} variant="outline" size="sm" className="glass border-primary/30 bg-transparent">
              <Folder className="w-4 h-4 mr-2" />
              {folder}
            </Button>
          ))}
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

      {/* Documents Table */}
      {!loading && (
        <Card className="glass border-primary/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-primary/20">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Size</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Folder</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Uploaded</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? "No documents match your search" : "No documents found"}
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.type}</td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.size}</td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.folder}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            doc.status === "indexed" ? "default" : doc.status === "processing" ? "secondary" : "destructive"
                          }
                          className={
                            doc.status === "indexed"
                              ? "bg-primary/20 text-primary border-primary/30"
                              : doc.status === "processing"
                                ? "bg-secondary/20 text-secondary border-secondary/30"
                                : ""
                          }
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{doc.uploadedAt.toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="hover:bg-primary/10 h-8 w-8"
                            onClick={() => viewDocument(doc.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="hover:bg-primary/10 h-8 w-8"
                            onClick={() => downloadDocument(doc.id, doc.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-destructive/10 text-destructive h-8 w-8"
                            onClick={() => deleteDocument(doc.id, knowledgeBases.find(kb => kb.name === doc.folder)?.id || "")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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