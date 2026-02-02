"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Edit2,
  Trash2,
  X,
  FileText,
  File,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface FilePreviewDialogProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  file,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedFilename, setEditedFilename] = useState(file.filename);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [isTextFile, setIsTextFile] = useState(false);

  // Determine file type and load preview
  useEffect(() => {
    const contentType = file.meta?.content_type || "";
    const filename = file.filename.toLowerCase();

    // Check if it's a viewable text file
    const isText =
      contentType.includes("text") ||
      contentType.includes("json") ||
      contentType.includes("xml") ||
      contentType.includes("application/pdf") ||
      filename.endsWith(".txt") ||
      filename.endsWith(".json") ||
      filename.endsWith(".xml") ||
      filename.endsWith(".md") ||
      filename.endsWith(".csv");

    setIsTextFile(isText);

    if (isText && open) {
      loadFileContent();
    }
  }, [file, open]);

  // Load file content
  const loadFileContent = async () => {
    try {
      setLoadingContent(true);
      const response = await fetch(`/api/files/${file.id}/download`);

      if (!response.ok) {
        throw new Error("Failed to load file content");
      }

      // Check if it's binary or text
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text") || file.filename.endsWith(".json") || file.filename.endsWith(".csv")) {
        const text = await response.text();
        setFileContent(text);
      } else {
        setFileContent("[Binary file - cannot display content]");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      });
      setFileContent("[Error loading content]");
    } finally {
      setLoadingContent(false);
    }
  };

  // Save file name changes
  const handleSaveFilename = async () => {
    if (!editedFilename.trim()) {
      toast({
        title: "Error",
        description: "Filename cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: editedFilename,
          meta: file.meta,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update filename");
      }

      setIsEditing(false);
      onUpdate();
      toast({
        title: "Success",
        description: "File renamed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename file",
        variant: "destructive",
      });
    }
  };

  // Download file
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/api/files/${file.id}/download`;
    link.download = file.filename;
    link.click();
  };

  // Get file icon based on type
  const getFileIcon = () => {
    const contentType = file.meta?.content_type || "";
    const filename = file.filename.toLowerCase();

    if (contentType.includes("pdf") || filename.endsWith(".pdf")) {
      return "📄";
    }
    if (
      contentType.includes("spreadsheet") ||
      contentType.includes("excel") ||
      filename.endsWith(".xlsx") ||
      filename.endsWith(".xls") ||
      filename.endsWith(".csv")
    ) {
      return "📊";
    }
    if (
      contentType.includes("word") ||
      contentType.includes("document") ||
      filename.endsWith(".docx") ||
      filename.endsWith(".doc")
    ) {
      return "📝";
    }
    if (contentType.includes("image")) {
      return "🖼️";
    }
    if (contentType.includes("video")) {
      return "🎥";
    }
    if (contentType.includes("audio")) {
      return "🎵";
    }
    if (contentType.includes("text") || filename.endsWith(".txt")) {
      return "📃";
    }
    return "📦";
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getFileIcon()}</span>
            {isEditing ? (
              <Input
                value={editedFilename}
                onChange={(e) => setEditedFilename(e.target.value)}
                className="flex-1"
                autoFocus
              />
            ) : (
              <span className="flex-1 truncate">{file.filename}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
              <p className="text-sm font-semibold">
                {file.meta?.content_type || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Size</p>
              <p className="text-sm font-semibold">
                {formatFileSize(file.meta?.size)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-sm font-semibold">{formatDate(file.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Modified</p>
              <p className="text-sm font-semibold">{formatDate(file.updated_at)}</p>
            </div>
          </div>

          {/* File Preview */}
          <div className="border rounded-lg overflow-hidden">
            {loadingContent ? (
              <div className="p-8 text-center text-gray-500">
                Loading file content...
              </div>
            ) : isTextFile && fileContent ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                  {fileContent.substring(0, 10000)}
                  {fileContent.length > 10000 && (
                    <p className="text-gray-500 mt-4">
                      ... (Content truncated - showing first 10000 characters)
                    </p>
                  )}
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">{getFileIcon()}</p>
                <p className="mt-2">Preview not available for this file type</p>
                <p className="text-sm mt-2">Download the file to view it in detail</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedFilename(file.filename);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFilename}>Save</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={16} className="mr-2" />
                Rename
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download size={16} className="mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this file?")) {
                    onDelete();
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
