import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
  Award,
  Users,
  ShoppingCart,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Import Reward types defined in schema.ts
type RewardRule = {
  id: number;
  name: string;
  description: string;
  type: string;
  pointsAwarded: number;
  minimumOrderValue: number | null;
  percentageValue: number | null;
  categoryId: number | null;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type RewardTransaction = {
  id: number;
  userId: number;
  orderId: number | null;
  productId: number | null;
  points: number;
  type: string;
  description: string | null;
  transactionDate: string;
  expiryDate: string | null;
  status: string;
};

type RewardStatistics = {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeUsers: number;
};

function RewardsManagement() {
  const [activeTab, setActiveTab] = useState("rules");
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [isAddPointsDialogOpen, setIsAddPointsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<RewardRule>>({
    name: "",
    description: "",
    type: "purchase",
    pointsAwarded: 0,
    minimumOrderValue: null,
    percentageValue: null,
    active: true,
  });
  const [pointsToAdd, setPointsToAdd] = useState({
    userId: 0,
    points: 0,
    type: "manual",
    description: "Manual points adjustment by admin",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reward rules
  const { data: rules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ["/api/admin/rewards/rules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/rewards/rules");
      const data = await response.json();
      return data;
    },
  });

  // Fetch reward statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/rewards/statistics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/rewards/statistics");
      const data = await response.json();
      return data;
    },
  });

  // Fetch reward transactions (most recent)
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery(
    {
      queryKey: ["/api/admin/rewards/transactions"],
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          "/api/admin/rewards/transactions?limit=20"
        );
        const data = await response.json();
        return data;
      },
    }
  );

  // Create reward rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: Partial<RewardRule>) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/rewards/rules",
        ruleData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards/rules"] });
      toast({
        title: "Success",
        description: "Reward rule created successfully",
      });
      setIsAddRuleDialogOpen(false);
      setNewRule({
        name: "",
        description: "",
        type: "purchase",
        pointsAwarded: 0,
        minimumOrderValue: null,
        percentageValue: null,
        active: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create reward rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update reward rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<RewardRule>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/rewards/rules/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards/rules"] });
      toast({
        title: "Success",
        description: "Reward rule updated successfully",
      });
      setIsEditRuleDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update reward rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete reward rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/rewards/rules/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards/rules"] });
      toast({
        title: "Success",
        description: "Reward rule deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete reward rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: async (pointsData: typeof pointsToAdd) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/rewards/points",
        pointsData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/rewards/statistics"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/rewards/transactions"],
      });
      toast({
        title: "Success",
        description: "Points added successfully",
      });
      setIsAddPointsDialogOpen(false);
      setPointsToAdd({
        userId: 0,
        points: 0,
        type: "manual",
        description: "Manual points adjustment by admin",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateRule = () => {
    createRuleMutation.mutate(newRule);
  };

  const handleUpdateRule = () => {
    if (!selectedRule) return;
    updateRuleMutation.mutate({ id: selectedRule.id, data: selectedRule });
  };

  const handleDeleteRule = (id: number) => {
    if (confirm("Are you sure you want to delete this reward rule?")) {
      deleteRuleMutation.mutate(id);
    }
  };

  const handleAddPoints = () => {
    if (pointsToAdd.userId <= 0 || pointsToAdd.points <= 0) {
      toast({
        title: "Error",
        description: "User ID and points must be positive numbers",
        variant: "destructive",
      });
      return;
    }
    addPointsMutation.mutate(pointsToAdd);
  };

  const handleEditRule = (rule: RewardRule) => {
    setSelectedRule(rule);
    setIsEditRuleDialogOpen(true);
  };

  // Helper function to format date relative to now
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Helper to get badge color for transaction type
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-800";
      case "redeem":
        return "bg-blue-100 text-blue-800";
      case "expire":
        return "bg-red-100 text-red-800";
      case "referral":
        return "bg-purple-100 text-purple-800";
      case "signup":
        return "bg-yellow-100 text-yellow-800";
      case "review":
        return "bg-indigo-100 text-indigo-800";
      case "manual":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="px-2 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Rewards Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/rewards/rules"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/rewards/statistics"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/rewards/transactions"],
                });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button onClick={() => setIsAddPointsDialogOpen(true)}>
              <Award className="mr-2 h-4 w-4" />
              Add Points
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Points Issued</CardTitle>
              <CardDescription>Lifetime points issued to users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {isLoadingStats
                  ? "..."
                  : statistics?.totalPointsIssued.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Points Redeemed</CardTitle>
              <CardDescription>
                Lifetime points redeemed by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {isLoadingStats
                  ? "..."
                  : statistics?.totalPointsRedeemed.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Users</CardTitle>
              <CardDescription>Users with reward points</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {isLoadingStats
                  ? "..."
                  : statistics?.activeUsers.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="rules">
              <Award className="h-4 w-4 mr-2" />
              Reward Rules
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Rewards
            </TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Reward Rules</CardTitle>
                  <Button onClick={() => setIsAddRuleDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Rule
                  </Button>
                </div>
                <CardDescription>
                  Configure rules for awarding points to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Conditions</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule: RewardRule) => (
                          <TableRow key={rule.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {rule.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${getTransactionTypeColor(rule.type)}`}
                              >
                                {rule.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{rule.pointsAwarded}</TableCell>
                            <TableCell>
                              {rule.minimumOrderValue ? (
                                <div className="text-sm">
                                  Min Order: ₹{rule.minimumOrderValue}
                                </div>
                              ) : null}
                              {rule.percentageValue ? (
                                <div className="text-sm">
                                  Percentage: {rule.percentageValue}%
                                </div>
                              ) : null}
                              {rule.validFrom ? (
                                <div className="text-sm">
                                  Valid:{" "}
                                  {new Date(
                                    rule.validFrom
                                  ).toLocaleDateString()}{" "}
                                  -
                                  {rule.validTo
                                    ? new Date(
                                        rule.validTo
                                      ).toLocaleDateString()
                                    : "No end date"}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={rule.active ? "success" : "secondary"}
                              >
                                {rule.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRule(rule)}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reward Transactions</CardTitle>
                <CardDescription>
                  Most recent reward point transactions across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsData?.transactions?.map(
                          (transaction: RewardTransaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.userId}</TableCell>
                              <TableCell
                                className={
                                  transaction.points > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {transaction.points > 0 ? "+" : ""}
                                {transaction.points}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${getTransactionTypeColor(transaction.type)}`}
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                {formatDate(transaction.transactionDate)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    transaction.status === "active"
                                      ? "success"
                                      : transaction.status === "used"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Rewards Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Rewards Management</CardTitle>
                <CardDescription>
                  Search for a user to view and manage their reward points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      placeholder="Enter user ID"
                      type="number"
                      value={pointsToAdd.userId || ""}
                      onChange={(e) =>
                        setPointsToAdd({
                          ...pointsToAdd,
                          userId: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      placeholder="Enter points"
                      type="number"
                      value={pointsToAdd.points || ""}
                      onChange={(e) =>
                        setPointsToAdd({
                          ...pointsToAdd,
                          points: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddPoints}>Add Points</Button>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4">
                  To view a specific user's reward transactions, navigate to the
                  Users page and select the user.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Rule Dialog */}
        <Dialog
          open={isAddRuleDialogOpen}
          onOpenChange={setIsAddRuleDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Reward Rule</DialogTitle>
              <DialogDescription>
                Create a new rule for awarding points to users
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule({ ...newRule, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newRule.description}
                  onChange={(e) =>
                    setNewRule({ ...newRule, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Rule Type</Label>
                <Select
                  value={newRule.type}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase Reward</SelectItem>
                    <SelectItem value="signup">Signup Bonus</SelectItem>
                    <SelectItem value="review">Product Review</SelectItem>
                    <SelectItem value="referral">Referral Reward</SelectItem>
                    <SelectItem value="birthday">Birthday Reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pointsAwarded">Points Awarded</Label>
                <Input
                  id="pointsAwarded"
                  type="number"
                  placeholder="Enter points"
                  value={newRule.pointsAwarded || ""}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      pointsAwarded: Number(e.target.value),
                    })
                  }
                />
              </div>
              {newRule.type === "purchase" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="minimumOrderValue">
                      Minimum Order Value (₹)
                    </Label>
                    <Input
                      id="minimumOrderValue"
                      type="number"
                      placeholder="Enter minimum order value"
                      value={newRule.minimumOrderValue || ""}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          minimumOrderValue: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="percentageValue">
                      Percentage Value (%)
                    </Label>
                    <Input
                      id="percentageValue"
                      type="number"
                      placeholder="Enter percentage value"
                      value={newRule.percentageValue || ""}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          percentageValue: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use fixed points instead
                    </p>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newRule.active}
                  onCheckedChange={(checked) =>
                    setNewRule({ ...newRule, active: checked })
                  }
                />
                <Label htmlFor="active">Rule Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddRuleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rule Dialog */}
        <Dialog
          open={isEditRuleDialogOpen}
          onOpenChange={setIsEditRuleDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Reward Rule</DialogTitle>
              <DialogDescription>
                Update an existing reward rule
              </DialogDescription>
            </DialogHeader>
            {selectedRule && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Rule Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter rule name"
                    value={selectedRule.name}
                    onChange={(e) =>
                      setSelectedRule({ ...selectedRule, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    placeholder="Enter description"
                    value={selectedRule.description}
                    onChange={(e) =>
                      setSelectedRule({
                        ...selectedRule,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-pointsAwarded">Points Awarded</Label>
                  <Input
                    id="edit-pointsAwarded"
                    type="number"
                    placeholder="Enter points"
                    value={selectedRule.pointsAwarded || ""}
                    onChange={(e) =>
                      setSelectedRule({
                        ...selectedRule,
                        pointsAwarded: Number(e.target.value),
                      })
                    }
                  />
                </div>
                {selectedRule.type === "purchase" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-minimumOrderValue">
                        Minimum Order Value (₹)
                      </Label>
                      <Input
                        id="edit-minimumOrderValue"
                        type="number"
                        placeholder="Enter minimum order value"
                        value={selectedRule.minimumOrderValue || ""}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            minimumOrderValue: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-percentageValue">
                        Percentage Value (%)
                      </Label>
                      <Input
                        id="edit-percentageValue"
                        type="number"
                        placeholder="Enter percentage value"
                        value={selectedRule.percentageValue || ""}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            percentageValue: Number(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use fixed points instead
                      </p>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={selectedRule.active}
                    onCheckedChange={(checked) =>
                      setSelectedRule({ ...selectedRule, active: checked })
                    }
                  />
                  <Label htmlFor="edit-active">Rule Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditRuleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRule}>Update Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Points Dialog */}
        <Dialog
          open={isAddPointsDialogOpen}
          onOpenChange={setIsAddPointsDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Points to User</DialogTitle>
              <DialogDescription>
                Manually add reward points to a user
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-userId">User ID</Label>
                <Input
                  id="add-userId"
                  type="number"
                  placeholder="Enter user ID"
                  value={pointsToAdd.userId || ""}
                  onChange={(e) =>
                    setPointsToAdd({
                      ...pointsToAdd,
                      userId: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-points">Points</Label>
                <Input
                  id="add-points"
                  type="number"
                  placeholder="Enter points to add"
                  value={pointsToAdd.points || ""}
                  onChange={(e) =>
                    setPointsToAdd({
                      ...pointsToAdd,
                      points: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-description">Description</Label>
                <Input
                  id="add-description"
                  placeholder="Enter description"
                  value={pointsToAdd.description}
                  onChange={(e) =>
                    setPointsToAdd({
                      ...pointsToAdd,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddPointsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPoints}>Add Points</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default RewardsManagement;
