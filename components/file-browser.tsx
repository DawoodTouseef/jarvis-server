"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File as FileIcon,
  Plus,
  Trash2,
  Edit2,
  Download,
  Eye,
  FolderPlus,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import FilePreviewDialog from "@/components/file-preview-dialog";

interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  is_expanded?: boolean;
  created_at: number;
  updated_at: number;
  meta?: Record<string, any>;
  data?: Record<string, any>;
}

interface FileItem {
  id: string;
  filename: string;
  meta: {
    name?: string;
    content_type?: string;
    size?: number;
  };
  created_at: number;
  updated_at: number;
  user_id: string;
  hash?: string;
  data?: Record<string, any>;
  path?: string;
}

interface TreeItem {
  id: string;
  name: string;
  type: "folder" | "file";
  isExpanded?: boolean;
  children?: TreeItem[];
  originalData: FolderItem | FileItem;
}

const FileBrowser: React.FC = () => {
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TreeItem | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedParentFolder, setSelectedParentFolder] = useState<string | null>(
    null
  );
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  // Fetch folders and files
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [foldersRes, filesRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/files"),
      ]);

      if (!foldersRes.ok || !filesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const foldersData = await foldersRes.json();
      const filesData = await filesRes.json();

      setFolders(foldersData);
      setFiles(filesData);

      // Build tree structure
      buildTreeStructure(foldersData, filesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load folders and files",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Build tree structure from folders and files
  const buildTreeStructure = (foldersList: FolderItem[], filesList: FileItem[]) => {
    const rootFolders = foldersList.filter((f) => !f.parent_id);
    
    const buildBranch = (parentId: string | null): TreeItem[] => {
      const items: TreeItem[] = [];

      // Add child folders
      const childFolders = foldersList.filter((f) => f.parent_id === parentId);
      childFolders.forEach((folder) => {
        items.push({
          id: folder.id,
          name: folder.name,
          type: "folder",
          isExpanded: folder.is_expanded ?? false,
          originalData: folder,
          children: buildBranch(folder.id),
        });
      });

      // Add files in this folder (from folder's data)
      const folderWithId = foldersList.find((f) => f.id === parentId);
      if (folderWithId?.data?.files) {
        folderWithId.data.files.forEach((fileRef: any) => {
          if (fileRef.type === "file") {
            const file = filesList.find((f) => f.id === fileRef.id);
            if (file) {
              items.push({
                id: file.id,
                name: file.filename,
                type: "file",
                originalData: file,
              });
            }
          }
        });
      }

      return items;
    };

    // Root level files
    const rootItems: TreeItem[] = [];
    const rootFolderIds = new Set(rootFolders.map((f) => f.id));
    const rootFiles = filesList.filter((f) => {
      const inFolder = foldersList.some(
        (folder) => folder.data?.files?.some((file: any) => file.id === f.id)
      );
      return !inFolder;
    });

    rootFiles.forEach((file) => {
      rootItems.push({
        id: file.id,
        name: file.filename,
        type: "file",
        originalData: file,
      });
    });

    rootFolders.forEach((folder) => {
      rootItems.push({
        id: folder.id,
        name: folder.name,
        type: "folder",
        isExpanded: folder.is_expanded ?? false,
        originalData: folder,
        children: buildBranch(folder.id),
      });
    });

    setTreeData(rootItems);
  };

  // Toggle folder expansion
  const toggleFolderExpansion = async (folderId: string) => {
    const updateTreeItem = (items: TreeItem[]): TreeItem[] => {
      return items.map((item) => {
        if (item.id === folderId && item.type === "folder") {
          return {
            ...item,
            isExpanded: !item.isExpanded,
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updateTreeItem(item.children),
          };
        }
        return item;
      });
    };

    setTreeData(updateTreeItem(treeData));

    // Update on backend
    try {
      await fetch(`/api/folders/${folderId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_expanded: !folders.find((f) => f.id === folderId)?.is_expanded,
        }),
      });
    } catch (error) {
      console.error("Failed to update folder expansion state", error);
    }
  };

  // Create new folder
  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parent_id: selectedParentFolder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      setNewFolderName("");
      setShowNewFolderDialog(false);
      setSelectedParentFolder(null);
      await fetchData();

      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }

      await fetchData();
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      await fetchData();
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Render tree item
  const renderTreeItem = (item: TreeItem, depth: number = 0): React.ReactNode => {
    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group"
          onClick={() => setSelectedItem(item)}
        >
          {item.type === "folder" ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpansion(item.id);
                }}
                className="p-0"
              >
                {item.isExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              <Folder size={18} className="text-yellow-500" />
              <span className="flex-1 text-sm">{item.name}</span>
            </>
          ) : (
            <>
              <div className="w-[18px]" />
              <FileIcon size={18} className="text-blue-500" />
              <span className="flex-1 text-sm">{item.name}</span>
            </>
          )}

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {item.type === "folder" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParentFolder(item.id);
                  setShowNewFolderDialog(true);
                }}
              >
                <FolderPlus size={16} />
              </Button>
            )}
            {item.type === "file" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                  setShowFilePreview(true);
                }}
              >
                <Eye size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (item.type === "folder") {
                  deleteFolder(item.id);
                } else {
                  deleteFile(item.id);
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {item.type === "folder" && item.isExpanded && item.children && (
          <div style={{ marginLeft: `${depth * 10}px` }}>
            {item.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify({ parent_id: selectedParentFolder }));

      try {
        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        toast({
          title: "Success",
          description: `File ${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        console.error(error);
      }
    }

    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setSelectedParentFolder(null);
            setShowNewFolderDialog(true);
          }}
          variant="default"
        >
          <FolderPlus size={18} className="mr-2" />
          New Folder
        </Button>

        <label>
          <Button variant="outline" asChild>
            <span className="cursor-pointer">
              <Upload size={18} className="mr-2" />
              Upload File
            </span>
          </Button>
          <input
            type="file"
            multiple
            hidden
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </label>
      </div>

      {/* File Tree */}
      <div className="flex-1 border rounded-lg p-4 overflow-y-auto">
        {treeData.length === 0 ? (
          <div className="text-center text-gray-500 py-8 justify-center">
            No folders or files yet. Create a folder or upload a file to get started.
          </div>
        ) : (
          <div className="space-y-1">
            {treeData.map((item) => renderTreeItem(item))}
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                createNewFolder();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {selectedItem && selectedItem.type === "file" && (
        <FilePreviewDialog
          file={selectedItem.originalData as FileItem}
          open={showFilePreview}
          onOpenChange={setShowFilePreview}
          onUpdate={fetchData}
          onDelete={() => {
            deleteFile(selectedItem.id);
            setShowFilePreview(false);
          }}
        />
      )}
    </>
  );
};

export default FileBrowser;
