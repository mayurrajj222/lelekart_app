import { useCallback, useState } from "react";
import { UploadCloud, Loader2, X, Check, AlertTriangle, ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MultiMediaPicker } from "@/components/multi-media-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FileUploadProps {
  onChange: ((url: string) => void) | ((urls: string[]) => void);
  value?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  id?: string;
  multiple?: boolean;
  showMediaLibrary?: boolean;
}

export function FileUpload({
  onChange,
  value,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 5,
  className,
  id = "file-upload",
  multiple = false,
  showMediaLibrary = true
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const { toast } = useToast();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleUpload = useCallback(
    async (file: File) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed with status ${response.status}: ${errorText}`);
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const data = await response.json();
        console.log(`Upload success, received URL: ${data.url}`);
        
        // Firefox-safe implementation: use a local variable before state update
        const uploadedUrl = data.url;
        
        // Handle single file upload
        if (!multiple) {
          onChange(uploadedUrl);
        }
        
        toast({
          title: "File uploaded",
          description: `File "${file.name}" uploaded successfully.`,
        });
        
        return uploadedUrl;
      } catch (err) {
        console.error("Error uploading file:", err);
        setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err instanceof Error ? err.message : "There was an error uploading your file. Please try again.",
        });
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onChange, maxSizeBytes, maxSizeMB, toast, multiple]
  );

  const handleMultipleFilesUpload = useCallback(
    async (files: FileList) => {
      if (!multiple) {
        // If not in multiple mode, just upload the first file
        const file = files[0];
        if (file) {
          handleUpload(file);
        }
        return;
      }
      
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;
      
      setIsUploading(true);
      setError(null);
      
      const uploadedUrls: string[] = [];
      
      try {
        // Process files sequentially
        for (let i = 0; i < fileArray.length; i++) {
          setUploadProgress(Math.round((i / fileArray.length) * 100));
          const url = await handleUpload(fileArray[i]);
          if (url) {
            uploadedUrls.push(url);
          }
        }
        
        // If we have uploaded urls, call onChange with array of urls
        if (uploadedUrls.length > 0) {
          (onChange as (urls: string[]) => void)(uploadedUrls);
        }
        
        if (uploadedUrls.length > 1) {
          toast({
            title: "Multiple files uploaded",
            description: `Successfully uploaded ${uploadedUrls.length} files.`,
          });
        }
      } catch (err) {
        console.error("Error in multiple file upload:", err);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error uploading some files.",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [handleUpload, multiple, onChange, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (multiple) {
      handleMultipleFilesUpload(files);
    } else {
      const file = files[0];
      if (file) {
        handleUpload(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    if (multiple) {
      handleMultipleFilesUpload(files);
    } else {
      const file = files[0];
      if (file) {
        handleUpload(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = () => {
    if (multiple) {
      (onChange as (urls: string[]) => void)([]);
    } else {
      (onChange as (url: string) => void)("");
    }
  };

  // Handler for media library selection
  const handleMediaSelect = (selectedUrls: string[]) => {
    if (multiple) {
      (onChange as (urls: string[]) => void)(selectedUrls);
    } else if (selectedUrls.length > 0) {
      (onChange as (url: string) => void)(selectedUrls[0]);
    }
    setMediaDialogOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {value ? (
        <div className="relative rounded-md overflow-hidden border">
          <img 
            src={value} 
            alt="Uploaded file"
            className="w-full h-48 object-contain bg-secondary/30"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Media Library Dialog */}
          {showMediaLibrary && (
            <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select from Media Library</DialogTitle>
                  <DialogDescription>
                    Choose images from your media library to use in your product.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <MultiMediaPicker
                    onSelect={handleMediaSelect}
                    selectedUrls={multiple ? [] : value ? [value] : []}
                    buttonLabel="Select Images"
                    maxImages={multiple ? 8 : 1}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* Main upload area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors",
                error && "border-destructive text-destructive",
                isUploading && "opacity-70 pointer-events-none"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById(id)?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading file...</p>
                </>
              ) : error ? (
                <>
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <p className="text-xs text-muted-foreground">Click to try again</p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a file (max {maxSizeMB}MB)
                  </p>
                </>
              )}
              <Input
                id={id}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
                multiple={multiple}
              />
            </div>
            
            {/* Media Library Button */}
            {showMediaLibrary && (
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 border-primary border-dashed"
                onClick={() => setMediaDialogOpen(true)}
              >
                <ImagePlus className="h-4 w-4" />
                <span>Select from Media Library</span>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function FileUploadRow({
  onChange,
  value,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 5,
  className,
  id = "file-upload-row",
  showMediaLibrary = true,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const { toast } = useToast();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleUpload = useCallback(
    async (file: File) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return;
      }

      setIsUploading(true);
      setIsSuccess(false);

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        console.log(`FileUploadRow: Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FileUploadRow: Upload failed with status ${response.status}: ${errorText}`);
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const data = await response.json();
        console.log(`FileUploadRow: Upload success, received URL: ${data.url}`);
        // Firefox-safe implementation: use a local variable before state update
        const uploadedUrl = data.url;
        (onChange as (url: string) => void)(uploadedUrl);
        setIsSuccess(true);
        
        toast({
          title: "File uploaded",
          description: `File "${file.name}" uploaded successfully.`,
        });
      } catch (err) {
        console.error("FileUploadRow: Error uploading file:", err);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err instanceof Error ? err.message : "There was an error uploading your file. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, maxSizeBytes, maxSizeMB, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };
  
  // Handler for media library selection
  const handleMediaSelect = (selectedUrls: string[]) => {
    if (selectedUrls.length > 0) {
      (onChange as (url: string) => void)(selectedUrls[0]);
    }
    setMediaDialogOpen(false);
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Media Library Dialog */}
      {showMediaLibrary && (
        <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select from Media Library</DialogTitle>
              <DialogDescription>
                Choose an image from your media library to use in your product.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <MultiMediaPicker
                onSelect={handleMediaSelect}
                selectedUrls={value ? [value] : []}
                buttonLabel="Select Image"
                maxImages={1}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    
      <div className="flex-1">
        <label className="block text-sm font-medium">{label}</label>
        {value && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {value.split("/").pop()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => window.open(value, "_blank")}
            >
              <Check className="h-4 w-4" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => (onChange as (url: string) => void)("")}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          </>
        ) : (
          <div className="flex gap-2">
            {showMediaLibrary && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-primary border-dashed"
                onClick={() => setMediaDialogOpen(true)}
              >
                <ImagePlus className="h-3 w-3" /> Library
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={isUploading}
              onClick={() => document.getElementById(id)?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="h-3 w-3" /> Uploaded
                </>
              ) : (
                <>
                  <UploadCloud className="h-3 w-3" /> Upload
                </>
              )}
            </Button>
            <Input
              id={id}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}