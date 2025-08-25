import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  FilePlus,
  CheckSquare,
  XSquare,
  AlertTriangle,
  X,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BulkImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
    products: Array<{ id: number; name: string; status: string }>;
  } | null>(null);
  const [processingState, setProcessingState] = useState<
    "idle" | "uploading" | "validating" | "processing" | "complete" | "error"
  >("idle");

  // Categories for dropdown selection in template
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Mutation for uploading file
  // Reference to the progress interval
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the progress interval when unmounting
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/seller/products/bulk-import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process bulk import");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Clear any progress interval that might be running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setUploadResults({
        successful: data.successful || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
        products: data.products || [],
      });
      setProcessingState("complete");
      setUploadProgress(100);

      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });

      toast({
        title: "Bulk import processed",
        description: `Successfully added ${data.successful} products. ${data.failed} products failed to import.`,
        variant: data.successful > 0 ? "success" : "destructive",
      });
    },
    onError: (error) => {
      // Clear any progress interval that might be running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProcessingState("error");
      setUploadProgress(0);

      // Set an error result to display in the Flipkart-style error box
      setUploadResults({
        successful: 0,
        failed: 1,
        errors: [
          {
            row: 0,
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
        products: [],
      });

      // Also show a toast notification for immediate feedback
      toast({
        title: "Bulk import failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.type.includes("spreadsheet") &&
        !selectedFile.name.endsWith(".xlsx")
      ) {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setProcessingState("idle");
      setUploadResults(null);
    }
  };

  // Function to remove the selected file
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setProcessingState("idle");
    setUploadProgress(0);
    setUploadResults(null);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Function to handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setProcessingState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress for better UX
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 99) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setProcessingState("processing");
          return 99;
        }
        return newProgress;
      });
    }, 200);

    uploadMutation.mutate(formData);
  };

  // Function to download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/seller/products/bulk-import/template");
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-import-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template downloaded",
        description: "Product import template has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="max-w-3xl mx-auto py-4 sm:py-6 lg:py-10 px-4 sm:px-6">
        <Card className="space-y-6 sm:space-y-8 p-4 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bulk Product Import
            </h1>
            <p className="text-muted-foreground">
              Import multiple products at once using a CSV or Excel file
            </p>
          </div>

          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="import">Import Products</TabsTrigger>
              <TabsTrigger value="help">Help & Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4 mt-4">
              {/* Flipkart-style Upload Section */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Upload Products</h2>
                    <p className="text-gray-500 text-sm">
                      Upload your product data using the template format
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="h-10 border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>

                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                      placeholder="Select a CSV or Excel file"
                    />

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-10 border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Select File
                    </Button>

                    <Button
                      onClick={handleUpload}
                      disabled={
                        !file ||
                        processingState === "uploading" ||
                        processingState === "processing"
                      }
                      className="h-10 bg-blue-500 hover:bg-blue-600"
                    >
                      {processingState === "uploading" ||
                      processingState === "processing" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {processingState === "uploading"
                            ? "Uploading..."
                            : "Processing..."}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload and Process
                        </>
                      )}
                    </Button>
                  </div>

                  {file && (
                    <div className="flex items-center justify-between mt-4 text-sm bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="font-medium">{file.name}</span>
                        <span className="ml-2 text-gray-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-gray-500 hover:text-red-500 focus:outline-none"
                        disabled={
                          processingState === "uploading" ||
                          processingState === "processing"
                        }
                        title="Remove file"
                      >
                        {processingState === "error" ? (
                          <Trash2 className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  )}

                  {(processingState === "uploading" ||
                    processingState === "processing") && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span>
                          {processingState === "uploading"
                            ? "Uploading..."
                            : "Processing..."}
                        </span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Flipkart-style Results Section */}
              {uploadResults && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold">Import Results</h2>
                      <p className="text-gray-500 text-sm">
                        Summary of your bulk import operation
                      </p>
                    </div>

                    <div className="flex flex-row gap-6 mb-6">
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-3">
                          <CheckSquare className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Successful
                          </h3>
                          <p className="text-2xl font-bold">
                            {uploadResults.successful}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="rounded-full bg-red-100 p-3 mr-3">
                          <XSquare className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Failed
                          </h3>
                          <p className="text-2xl font-bold">
                            {uploadResults.failed}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* General result summary */}
                    {uploadResults.successful > 0 && (
                      <div className="p-4 rounded-md bg-green-50 border border-green-100 mb-5">
                        <div className="flex justify-between">
                          <div className="flex">
                            <CheckSquare className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-green-800">
                                Bulk import successful
                              </h3>
                              <p className="text-sm mt-1">
                                Successfully added {uploadResults.successful}{" "}
                                products.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flipkart-style error banner */}
                    {uploadResults.failed > 0 && (
                      <div className="mb-5">
                        <div className="p-4 bg-red-50 border border-red-100 rounded-t-md">
                          <div className="flex justify-between">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-red-800">
                                  Error Occurred
                                </h3>
                                <p className="text-sm mt-1 text-red-700">
                                  {uploadResults.failed} products failed to
                                  import.
                                </p>
                              </div>
                            </div>

                            <Button
                              onClick={handleRemoveFile}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 border-red-200 text-xs whitespace-nowrap"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear and try again
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadResults.errors.length > 0 && (
                      <div className="mt-5">
                        <h3 className="font-medium mb-3 text-gray-800">
                          Error Details
                        </h3>
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="w-20 py-3 text-gray-700">
                                  Row
                                </TableHead>
                                <TableHead className="py-3 text-gray-700">
                                  Error
                                </TableHead>
                                <TableHead className="w-40 py-3 text-gray-700">
                                  Recommendation
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadResults.errors.map((error, index) => {
                                // Determine a helpful recommendation based on the error message
                                let recommendation = "Check input format";

                                if (
                                  error.message.includes(
                                    "Missing required fields"
                                  )
                                ) {
                                  const missingFields = error.message.replace(
                                    "Missing required fields: ",
                                    ""
                                  );
                                  recommendation = `Add values for: ${missingFields}`;
                                } else if (
                                  error.message.includes("name must be between")
                                ) {
                                  recommendation = "Fix product name length";
                                } else if (error.message.includes("category")) {
                                  recommendation = "Use valid category";
                                } else if (
                                  error.message.includes("price") ||
                                  error.message.includes("stock")
                                ) {
                                  recommendation = "Use valid numbers";
                                }

                                return (
                                  <TableRow
                                    key={index}
                                    className="border-t border-gray-100"
                                  >
                                    <TableCell className="font-medium py-3 text-center">
                                      {error.row}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="text-red-600">
                                        {error.message}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {error.message.includes(
                                        "Missing required fields"
                                      ) ? (
                                        <div className="space-y-1">
                                          <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-600 font-normal border-blue-200"
                                          >
                                            {recommendation}
                                          </Badge>
                                          <div className="mt-1 text-xs text-gray-600">
                                            Add these fields in your CSV file:
                                            {error.message
                                              .replace(
                                                "Missing required fields: ",
                                                ""
                                              )
                                              .split(", ")
                                              .map((field) => (
                                                <Badge
                                                  key={field}
                                                  variant="outline"
                                                  className="bg-yellow-50 text-yellow-700 border-yellow-200 ml-1"
                                                >
                                                  {field}
                                                </Badge>
                                              ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="bg-blue-50 text-blue-600 font-normal border-blue-200"
                                        >
                                          {recommendation}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {uploadResults.products.length > 0 &&
                      uploadResults.successful > 0 && (
                        <div className="mt-5">
                          <h3 className="font-medium mb-3 text-gray-800">
                            Successfully Imported Products
                          </h3>
                          <div className="rounded-md border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="w-20 py-3 text-gray-700">
                                    ID
                                  </TableHead>
                                  <TableHead className="py-3 text-gray-700">
                                    Name
                                  </TableHead>
                                  <TableHead className="w-30 py-3 text-gray-700">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {uploadResults.products
                                  .filter(
                                    (product) => product.status === "success"
                                  )
                                  .map((product) => (
                                    <TableRow
                                      key={product.id}
                                      className="border-t border-gray-100"
                                    >
                                      <TableCell className="font-medium py-3">
                                        {product.id}
                                      </TableCell>
                                      <TableCell className="py-3">
                                        {product.name}
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <Badge className="bg-green-50 text-green-600 font-normal border-green-200">
                                          Success
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="help" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 pb-2">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">
                      Help & Instructions
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Follow these guidelines to ensure your bulk import is
                      successful
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-800">
                          Important Information
                        </h3>
                        <p className="text-sm mt-1 text-blue-700">
                          Please follow these guidelines carefully to ensure
                          your bulk product import is successful. The template
                          has specific formatting requirements.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                        <span className="font-semibold text-blue-600">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Download Template
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Download the CSV template which contains all required
                          columns for product import.
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                          <li>Do not delete or rename any column headers</li>
                          <li>Follow the format specified for each column</li>
                          <li>
                            The order of columns matters - do not rearrange them
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                        <span className="font-semibold text-blue-600">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Fill Product Data
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Fill in your product information following these
                          guidelines:
                        </p>
                        <div className="mt-3 space-y-4">
                          <div className="rounded-md border border-gray-200 p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <span className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">
                                !
                              </span>
                              Required Fields
                            </h4>
                            <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                              <li>
                                <span className="font-medium">Name</span>: 3-200
                                characters
                              </li>
                              <li>
                                <span className="font-medium">Description</span>
                                : optional, up to 2000 characters
                              </li>
                              <li>
                                <span className="font-medium">Price</span>:
                                numeric value (e.g. 499.99)
                              </li>
                              <li>
                                <span className="font-medium">
                                  Stock Quantity
                                </span>
                                : numeric value (e.g. 100)
                              </li>
                              <li>
                                <span className="font-medium">MRP</span>:
                                numeric value, must be ≥ Price
                              </li>
                              <li>
                                <span className="font-medium">Category</span>:
                                must match one of:{" "}
                                {Array.isArray(categories)
                                  ? categories
                                      .map((c: any) => c.name)
                                      .join(", ")
                                  : ""}
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-md border border-gray-200 p-4">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <span className="h-6 w-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs mr-2">
                                ★
                              </span>
                              Recommended Fields
                            </h4>
                            <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                              <li>
                                <span className="font-medium">
                                  At least one Image URL
                                </span>{" "}
                                (imageUrl1)
                              </li>
                              <li>
                                <span className="font-medium">Brand</span>: your
                                product's brand name
                              </li>
                              <li>
                                <span className="font-medium">SKU</span>: unique
                                identifier for your product
                              </li>
                              <li>
                                <span className="font-medium">Subcategory</span>
                                : must match existing subcategory
                              </li>
                              <li>
                                <span className="font-medium">GST Rate</span>:
                                applicable tax rate for the product
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-md border border-gray-200 p-4">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <span className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">
                                +
                              </span>
                              Additional Fields
                            </h4>
                            <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                              <li>
                                <span className="font-medium">Variants</span>:
                                Color, Size, Type
                              </li>
                              <li>
                                <span className="font-medium">Dimensions</span>:
                                length, width, height, weight
                              </li>
                              <li>
                                <span className="font-medium">Warranty</span>:
                                in days (e.g. 365 for 1 year)
                              </li>
                              <li>
                                <span className="font-medium">
                                  Return Policy
                                </span>
                                : in days (e.g. 30)
                              </li>
                              <li>
                                <span className="font-medium">
                                  Specifications
                                </span>
                                : technical details
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                        <span className="font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Upload and Process
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Save your completed template and upload it through the
                          interface.
                        </p>
                        <div className="mt-3 flex space-x-6">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              Accepted Formats
                            </h4>
                            <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                              <li>CSV (.csv) - Recommended</li>
                              <li>Excel Spreadsheet (.xlsx)</li>
                            </ul>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              Size Limits
                            </h4>
                            <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-1">
                              <li>Maximum 500 products per file</li>
                              <li>Maximum file size: 5MB</li>
                            </ul>
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mt-4">
                          <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                            <p className="text-sm text-yellow-700">
                              After processing, you'll see import results
                              showing successful and failed products. Any errors
                              will be displayed with specific row numbers and
                              reasons for failure to help you troubleshoot.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                        <span className="font-semibold text-blue-600">?</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Common Issues and Solutions
                        </h3>
                        <div className="mt-3 space-y-3">
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800">
                                Invalid Category
                              </h4>
                            </div>
                            <div className="p-3">
                              <p className="text-gray-600 text-sm">
                                Ensure your category exactly matches one of our
                                categories:{" "}
                                {Array.isArray(categories)
                                  ? categories
                                      .map((c: any) => c.name)
                                      .join(", ")
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800">
                                Price Format
                              </h4>
                            </div>
                            <div className="p-3">
                              <p className="text-gray-600 text-sm">
                                Prices should be entered as numbers without
                                currency symbols (e.g., "99.99" not "₹99.99")
                              </p>
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800">
                                Image URLs
                              </h4>
                            </div>
                            <div className="p-3">
                              <p className="text-gray-600 text-sm">
                                Image URLs must be publicly accessible and end
                                with image extensions (.jpg, .png, etc.). Image
                                URLs are optional.
                              </p>
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-md overflow-hidden mt-4">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800">
                                Required vs Optional Fields
                              </h4>
                            </div>
                            <div className="p-3">
                              <p className="text-gray-600 text-sm mb-2">
                                <strong>Required Fields:</strong> name, price,
                                category
                              </p>
                              <p className="text-gray-600 text-sm">
                                <strong>Optional Fields:</strong> imageUrl1-4,
                                mrp, purchase_price, stock, subcategory, sku,
                                hsn, brand, color, size, specifications,
                                warranty, returnPolicy, tax, GST, length, width,
                                height, weight, sellerId
                              </p>
                              <p className="text-gray-600 text-sm mt-2">
                                <span className="text-amber-600 font-medium">
                                  Note:
                                </span>{" "}
                                Imported products will be visible in your
                                Products list with a "Pending" status. They
                                require admin approval before appearing to
                                buyers.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 flex justify-center">
                  <Button
                    onClick={handleDownloadTemplate}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Template
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
}
