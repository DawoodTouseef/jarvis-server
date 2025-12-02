"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Folder, 
  Clock, 
  Download, 
  Eye, 
  Filter,
  SortAsc,
  Hash
} from "lucide-react";
import { apiClient, KnowledgeBase as KnowledgeBaseType } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  folder: string;
  uploadedAt: Date;
  status: "indexed" | "processing" | "failed";
  contentPreview: string;
  tags: string[];
}

interface SearchResult {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  relevanceScore: number;
  pageNumber?: number;
  section?: string;
}

export function KnowledgeSearch() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState({
    fileType: "all",
    knowledgeBase: "all",
    dateRange: "all"
  });
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "name">("relevance");

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getKnowledgeBases();
      if (res.success && res.data) {
        setKnowledgeBases(res.data);
        
        // Flatten files from all knowledge bases into documents
        const allDocuments: Document[] = res.data.flatMap(kb => 
          (kb.files || []).map(file => ({
            id: file.id,
            name: file.meta?.name || file.id,
            type: file.meta?.content_type || "unknown",
            size: formatFileSize(file.meta?.size || 0),
            folder: kb.name,
            uploadedAt: new Date(file.created_at * 1000),
            status: "indexed" as const,
            contentPreview: "This is a preview of the document content...",
            tags: ["important", "reference", "manual"]
          }))
        );
        
        setDocuments(allDocuments);
      }
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge bases",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      
      // Simulate search API call with mock data
      // In a real implementation, this would call the search API
      const mockResults: SearchResult[] = [
        {
          id: "result-1",
          documentId: "doc-1",
          documentName: "User Manual.pdf",
          content: `...${searchQuery}... is an important feature that allows users to...`,
          relevanceScore: 0.95,
          pageNumber: 5
        },
        {
          id: "result-2",
          documentId: "doc-2",
          documentName: "Technical Documentation.docx",
          content: `The ${searchQuery} component handles all requests and responses...`,
          relevanceScore: 0.87,
          section: "API Reference"
        },
        {
          id: "result-3",
          documentId: "doc-3",
          documentName: "Installation Guide.txt",
          content: `To configure ${searchQuery}, follow these steps: 1. Open the settings...`,
          relevanceScore: 0.78,
          pageNumber: 12
        }
      ];
      
      // Sort results based on selected criteria
      const sortedResults = [...mockResults].sort((a, b) => {
        switch (sortBy) {
          case "relevance":
            return b.relevanceScore - a.relevanceScore;
          case "date":
            return 0; // Would sort by document date in real implementation
          case "name":
            return a.documentName.localeCompare(b.documentName);
          default:
            return b.relevanceScore - a.relevanceScore;
        }
      });
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  }, [searchQuery, sortBy]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
    if (fileType.includes("word") || fileType.includes("doc")) return <FileText className="w-4 h-4 text-blue-500" />;
    if (fileType.includes("excel") || fileType.includes("sheet")) return <FileText className="w-4 h-4 text-green-500" />;
    if (fileType.includes("image")) return <FileText className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getRelevanceColor = (score: number) => {
    if (score > 0.9) return "bg-green-500";
    if (score > 0.7) return "bg-yellow-500";
    return "bg-red-500";
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
          <h1 className="text-3xl font-bold">Knowledge Base Search</h1>
          <p className="text-muted-foreground">Search through your documents and knowledge base</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="glass border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents, content, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <Button className="h-12 px-6">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            <select 
              value={filters.fileType}
              onChange={(e) => setFilters({...filters, fileType: e.target.value})}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="doc">Documents</option>
              <option value="txt">Text Files</option>
            </select>
            
            <select 
              value={filters.knowledgeBase}
              onChange={(e) => setFilters({...filters, knowledgeBase: e.target.value})}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
            >
              <option value="all">All Knowledge Bases</option>
              {knowledgeBases.map(kb => (
                <option key={kb.id} value={kb.id}>{kb.name}</option>
              ))}
            </select>
            
            <select 
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <div className="flex items-center gap-2 ml-auto">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Results
            </CardTitle>
            <CardDescription>
              Found {searchResults.length} results for "{searchQuery}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="border border-border/50 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{result.documentName}</h3>
                        {result.pageNumber && (
                          <Badge variant="secondary" className="text-xs">
                            Page {result.pageNumber}
                          </Badge>
                        )}
                        {result.section && (
                          <Badge variant="outline" className="text-xs">
                            {result.section}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {result.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>Relevance: {(result.relevanceScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-24 bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${getRelevanceColor(result.relevanceScore)}`}
                            style={{ width: `${result.relevanceScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {searchResults.length === 0 && !searching && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Library */}
      {!searchQuery && (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Document Library
            </CardTitle>
            <CardDescription>
              Browse all documents in your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-border/50 rounded-lg p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {doc.folder}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {doc.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{doc.uploadedAt.toLocaleDateString()}</span>
                        </div>
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {doc.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {documents.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <Folder className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground">
                    Upload documents to your knowledge base to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}