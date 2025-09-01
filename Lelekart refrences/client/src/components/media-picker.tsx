import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import {
  getMediaItems,
  uploadMediaItem,
  MediaItem,
  formatFileSize,
} from "@/lib/mediaLibraryApi";
import { Image, Upload, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaPickerProps {
  onSelect: (url: string) => void;
  selectedUrl?: string;
  buttonLabel?: string;
}

export function MediaPicker({ onSelect, selectedUrl, buttonLabel = "Select Image" }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploadTab, setUploadTab] = useState<"browse" | "upload">("browse");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [dragOver, setDragOver] = useState(false);
  
  const { toast } = useToast();
  
  // Media library query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/media", page, 20, search],
    queryFn: () => getMediaItems(page, 20, search),
    enabled: open, // Only fetch when dialog is open
  });
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMedia(null);
      setUploadTab("browse");
      setSelectedFile(null);
      setAlt("");
      setTags("");
    }
  }, [open]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (alt) formData.append("alt", alt);
      if (tags) formData.append("tags", tags);
      
      const newMedia = await uploadMediaItem(formData);
      setSelectedMedia(newMedia);
      refetch();
      setUploadTab("browse");
      
      toast({
        title: "Upload successful",
        description: "File has been uploaded to media library",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading",
        variant: "destructive",
      });
    }
  };
  
  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };
  
  // Handle selection
  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url);
      setOpen(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center gap-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">{buttonLabel}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Media Library</DialogTitle>
              <DialogDescription>
                Select a media file from your library or upload a new one.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="browse" value={uploadTab} onValueChange={(v) => setUploadTab(v as "browse" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse Library</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browse" className="py-4">
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search media..."
                      className="pl-8"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setSearchInput('');
                      setSearch('');
                    }}
                    title="Reset search"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !data || data.items.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg">
                    <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No media found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {search ? "Try a different search term" : "Upload your first media item"}
                    </p>
                    {search && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchInput("");
                          setSearch("");
                        }}
                        className="mt-4"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {data.items.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-all h-32 ${
                          selectedMedia?.id === item.id
                            ? "ring-2 ring-primary scale-[0.98]"
                            : "hover:scale-[0.98]"
                        }`}
                        onClick={() => setSelectedMedia(item)}
                      >
                        {item.mimeType.startsWith("image/") ? (
                          <div
                            className="h-full w-full bg-cover bg-center flex items-center justify-center"
                            style={{
                              backgroundImage: `url(${item.url})`,
                              backgroundSize: "cover",
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-muted p-2">
                            <div className="text-3xl mb-2">
                              {item.mimeType.startsWith("image/") ? <Image /> : 
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="32" 
                                  height="32" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                              }
                            </div>
                            <span className="text-xs font-medium truncate max-w-full">
                              {item.originalName}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {data && data.total > 0 && (
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(data.total / 20)}
                    onPageChange={(newPage) => {
                      setPage(newPage);
                      // Scroll to top of dialog content
                      const dialogContent = document.querySelector('[role="dialog"]');
                      if (dialogContent) dialogContent.scrollTop = 0;
                    }}
                    siblingCount={1}
                  />
                )}
                
              </TabsContent>
              
              <TabsContent value="upload" className="py-4">
                <div className="grid gap-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver ? "border-primary bg-primary/10" : "border-gray-300"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("media-file-upload")?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    {selectedFile ? (
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </div>
                        {selectedFile.type.startsWith("image/") && (
                          <div className="mt-2">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview"
                              className="mx-auto max-h-40 rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                          Drag & drop or click to select
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports images, videos, documents, and more
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      id="media-file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="media-alt">Alt Text</Label>
                    <Input
                      id="media-alt"
                      value={alt}
                      onChange={(e) => setAlt(e.target.value)}
                      placeholder="Alternative text for accessibility"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="media-tags">Tags (comma separated)</Label>
                    <Input
                      id="media-tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="product, banner, logo"
                    />
                  </div>
                  
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                  >
                    Upload
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!selectedMedia}
              >
                Select
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {selectedUrl && (
          <div className="relative group">
            <img
              src={selectedUrl}
              alt="Selected media"
              className="h-12 w-12 object-cover rounded-md border"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onSelect("")}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}