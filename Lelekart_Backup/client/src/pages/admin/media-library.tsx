import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMediaItems,
  uploadMediaItem,
  deleteMediaItem,
  MediaItem,
  formatFileSize,
  formatDate,
  getFileIcon,
} from "@/lib/mediaLibraryApi";
import {
  Image,
  Upload,
  Trash2,
  MoreVertical,
  Search,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Constants for upload limits (should match backend)
const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function MediaLibraryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch media items
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/media", page, limit, search],
    queryFn: () => getMediaItems(page, limit, search),
  });

  // Upload media mutation
  const uploadMutation = useMutation({
    mutationFn: uploadMediaItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setUploadDialogOpen(false);

      // Determine the number of files uploaded based on response format
      const filesUploaded = data.items ? data.items.length : 1;

      toast({
        title: "Upload Successful",
        description:
          filesUploaded === 1
            ? "1 file has been uploaded successfully"
            : `${filesUploaded} files have been uploaded successfully`,
      });

      resetUploadForm();
    },
    onError: (error: any) => {
      console.error("Upload error:", error);

      let errorMessage = "Failed to upload media";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        try {
          const errorData = error.response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMediaItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete media",
        variant: "destructive",
      });
    },
  });

  // Reset upload form
  const resetUploadForm = () => {
    setSelectedFiles([]);
    setAlt("");
    setTags("");
    setUploadProgress(0);
  };

  // Handle file selection (limit to 10 files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      // Check file count (max 10)
      if (filesArray.length > 10) {
        toast({
          title: "Too many files",
          description: `You can upload up to 10 files at once.`,
          variant: "destructive",
        });
        return;
      }
      // Check file size
      const tooLarge = filesArray.find((f) => f.size > MAX_FILE_SIZE);
      if (tooLarge) {
        toast({
          title: "File too large",
          description: `File '${tooLarge.name}' exceeds the 50MB limit.`,
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(filesArray);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  // Handle upload submission
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }
    // Check file count
    if (selectedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload up to ${MAX_FILES} files at once.`,
        variant: "destructive",
      });
      return;
    }
    // Check file size
    const tooLarge = selectedFiles.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      toast({
        title: "File too large",
        description: `File '${tooLarge.name}' exceeds the 50MB limit.`,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();

    // Append all files with console logging
    console.log(`Uploading ${selectedFiles.length} files:`);
    selectedFiles.forEach((file, index) => {
      console.log(
        `File ${index + 1}: ${file.name}, size: ${file.size}, type: ${file.type}`
      );
      formData.append("file", file);
    });

    if (alt) {
      formData.append("alt", alt);
      console.log(`Added alt text: ${alt}`);
    }

    if (tags) {
      formData.append("tags", tags);
      console.log(`Added tags: ${tags}`);
    }

    // Debug: List all entries in FormData
    console.log("FormData entries:");
    for (const pair of formData.entries()) {
      console.log(
        `${pair[0]}: ${pair[1] instanceof File ? `File: ${(pair[1] as File).name}` : pair[1]}`
      );
    }

    uploadMutation.mutate(formData);
  };

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1); // Reset to first page when searching
  };

  // Handle delete media
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this media item?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AdminLayout>
      <div className="px-2 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Media Library</h1>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                refetch();
              }}
              title="Reset search"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-lg w-[95vw]">
                <div className="mb-2 text-sm text-muted-foreground">
                  <strong>Upload Limit:</strong> You can upload up to{" "}
                  <b>10 files</b> at a time. Each file must be <b>50MB</b> or
                  less.
                </div>
                <DialogHeader>
                  <DialogTitle>Upload Media</DialogTitle>
                  <DialogDescription>
                    Upload images or other files to your media library.
                    <br />
                    <span className="text-xs text-muted-foreground">
                      <strong>Upload Limit:</strong> You can upload up to{" "}
                      <b>10 files</b> at a time. Each file must be <b>50MB</b>{" "}
                      or less.
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragOver
                        ? "border-primary bg-primary/10"
                        : "border-gray-300"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-4">
                        <div className="font-medium">
                          Selected {selectedFiles.length} file
                          {selectedFiles.length > 1 ? "s" : ""}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(
                            selectedFiles.reduce(
                              (total, file) => total + file.size,
                              0
                            )
                          )}{" "}
                          total
                        </div>

                        {/* Show previews for the first file if it's an image */}
                        {selectedFiles[0]?.type.startsWith("image/") && (
                          <div className="mt-2">
                            <img
                              src={URL.createObjectURL(selectedFiles[0])}
                              alt="Preview"
                              className="mx-auto max-h-40 rounded"
                            />
                            {selectedFiles.length > 1 && (
                              <p className="text-xs mt-1 text-muted-foreground">
                                + {selectedFiles.length - 1} more file
                                {selectedFiles.length > 2 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Show list of file names if not too many */}
                        {selectedFiles.length <= 5 && (
                          <div className="text-left text-sm max-h-20 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="truncate">
                                {file.name}
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles([]);
                          }}
                        >
                          Clear selection
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                          Drag & drop or click to select multiple files
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports images, videos, documents, and more
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      id="file-upload"
                      name="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input
                      id="alt"
                      value={alt}
                      onChange={(e) => setAlt(e.target.value)}
                      placeholder="Alternative text for accessibility"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="product, banner, logo"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false);
                      resetUploadForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      selectedFiles.length === 0 || uploadMutation.isPending
                    }
                  >
                    {uploadMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Uploading...
                      </span>
                    ) : (
                      <span>
                        Upload{" "}
                        {selectedFiles.length > 0
                          ? `(${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"})`
                          : ""}
                      </span>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading media library</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Image className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No media found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try a different search term"
                : "Upload your first media item"}
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="p-0 h-40 relative group">
                    {item.mimeType.startsWith("image/") ? (
                      <div
                        className="h-full w-full bg-cover bg-center flex items-center justify-center"
                        style={{
                          backgroundImage: `url(${item.url})`,
                          backgroundSize: "cover",
                        }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
                          <div className="hidden group-hover:flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">
                            {getFileIcon(item.mimeType) === "image" && (
                              <Image />
                            )}
                            {getFileIcon(item.mimeType) === "file" && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {item.originalName}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
                          <div className="hidden group-hover:flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className="font-medium truncate max-w-full"
                          title={item.originalName}
                        >
                          {item.originalName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(item.size)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(item.url);
                              toast({
                                title: "URL copied",
                                description: "Image URL copied to clipboard",
                              });
                            }}
                          >
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            Open in new tab
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {item.tags && (
                      <div className="mt-2 flex flex-wrap gap-1 max-w-full">
                        {item.tags.split(",").map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 pt-0 text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / limit)}
                onPageChange={handlePageChange}
                siblingCount={1}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
