import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Check,
  Edit,
  Loader2,
  Percent,
  Save,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

interface Category {
  id: number;
  name: string;
  image: string;
  gstRate: number;
}

export default function GSTManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [defaultGstRate, setDefaultGstRate] = useState<string>("18");

  // Query to fetch categories
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Mutation to update category GST rate
  const updateGstRateMutation = useMutation({
    mutationFn: async ({
      categoryId,
      gstRate,
    }: {
      categoryId: number;
      gstRate: number;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/categories/${categoryId}/gst-rate`,
        { gstRate }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update GST rate");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "GST rate updated",
        description: "The GST rate has been successfully updated.",
      });
      setEditingId(null);
      setEditValue("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating GST rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update default GST rate
  const updateDefaultGstRateMutation = useMutation({
    mutationFn: async (gstRate: number) => {
      const response = await apiRequest(
        "PATCH",
        "/api/system-settings/default-gst-rate",
        { defaultGstRate: gstRate }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Failed to update default GST rate"
        );
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: "Default GST rate updated",
        description: "The default GST rate has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating default GST rate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query to fetch default GST rate
  const { data: systemSettings } = useQuery({
    queryKey: ["/api/system-settings"],
  });

  // Update local state when system settings are loaded
  useEffect(() => {
    if (systemSettings?.defaultGstRate !== undefined) {
      setDefaultGstRate(systemSettings.defaultGstRate.toString());
    }
  }, [systemSettings]);

  // Handle edit button click
  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValue(category.gstRate.toString());
  };

  // Handle save button click
  const handleSave = (categoryId: number) => {
    const gstRate = parseFloat(editValue);
    if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
      toast({
        title: "Invalid GST rate",
        description: "Please enter a valid GST rate between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    updateGstRateMutation.mutate({ categoryId, gstRate });
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Handle save default GST rate
  const handleSaveDefaultGstRate = () => {
    const gstRate = parseFloat(defaultGstRate);
    if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
      toast({
        title: "Invalid GST rate",
        description: "Please enter a valid GST rate between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    updateDefaultGstRateMutation.mutate(gstRate);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load categories."}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            GST Management
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Default GST Rate
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Set the default GST rate that will be applied to new categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultGstRate" className="text-xs sm:text-sm">
                  Default GST Rate (%)
                </Label>
                <div className="flex items-center">
                  <Input
                    id="defaultGstRate"
                    type="number"
                    value={defaultGstRate}
                    onChange={(e) => setDefaultGstRate(e.target.value)}
                    className="w-20 sm:w-24 h-9 sm:h-10 text-xs sm:text-sm"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <Percent className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button
                onClick={handleSaveDefaultGstRate}
                disabled={updateDefaultGstRateMutation.isPending}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              >
                {updateDefaultGstRateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Category GST Rates
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Edit GST rates for individual categories below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">
                      Category
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">
                      GST Rate (%)
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {editingId === category.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 sm:w-24 h-9 sm:h-10 text-xs sm:text-sm"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        ) : (
                          category.gstRate.toFixed(2)
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {editingId === category.id ? (
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              className="h-8 sm:h-9 text-xs sm:text-sm"
                              onClick={() => handleSave(category.id)}
                              disabled={updateGstRateMutation.isPending}
                            >
                              {updateGstRateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 sm:h-9 text-xs sm:text-sm"
                              onClick={handleCancel}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GST Guidelines</CardTitle>
            <CardDescription>
              Information about GST rates in India.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                GST (Goods and Services Tax) is an indirect tax levied on the
                supply of goods and services in India. GST rates generally fall
                into the following categories:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-medium">0% (Nil Rate)</span> - Essential
                  goods like milk, eggs, fruits, vegetables, etc.
                </li>
                <li>
                  <span className="font-medium">5%</span> - Items like packaged
                  food, textiles, basic clothing, etc.
                </li>
                <li>
                  <span className="font-medium">12%</span> - Processed food,
                  medicines, cellphones, etc.
                </li>
                <li>
                  <span className="font-medium">18%</span> - Most electronics,
                  computer hardware, industrial products, etc.
                </li>
                <li>
                  <span className="font-medium">28%</span> - Luxury items,
                  high-end electronics, automobiles, etc.
                </li>
              </ul>
              <p className="text-amber-600">
                Note: It's important to apply the correct GST rate as per the
                current tax regulations in India. The rates displayed here
                should be updated to reflect any changes in government policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
