import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  UserPlus,
  Loader2,
  Trash2,
  UserCog,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AdminUsers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    open: boolean;
    userId: number | null;
    currentRole: string;
    newRole: string;
  }>({
    open: false,
    userId: null,
    currentRole: "",
    newRole: "",
  });

  // State for delete user confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    userId: number | null;
    username: string;
  }>({
    open: false,
    userId: null,
    username: "",
  });

  // State for impersonation confirmation
  const [confirmImpersonate, setConfirmImpersonate] = useState<{
    open: boolean;
    userId: number | null;
    username: string;
    role: string;
  }>({
    open: false,
    userId: null,
    username: "",
    role: "",
  });

  // Fetch users data
  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/role`, {
        role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Impersonate user mutation
  const impersonateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/impersonate/${userId}`);
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "Impersonation started",
        description:
          data.message || "You are now impersonating the selected user.",
      });

      // Redirect based on the impersonated user's role
      const role = data.user?.role;
      if (role === "seller") {
        // When impersonating a seller, also invalidate seller-specific data to ensure
        // product lists and other data are fetched fresh with the new seller ID
        console.log(
          "Impersonating seller - invalidating seller-specific queries"
        );
        // Include the seller ID in the query key to ensure proper cache invalidation
        const sellerId = data.user?.id;
        if (sellerId) {
          queryClient.invalidateQueries({
            queryKey: ["/api/seller/products", sellerId],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/seller/inventory", sellerId],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/seller/orders", sellerId],
            exact: false,
          });
        } else {
          // Fallback to general invalidation
          queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
          queryClient.invalidateQueries({
            queryKey: ["/api/seller/inventory"],
          });
          queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
        }
        setLocation("/seller/dashboard");
      } else if (role === "buyer") {
        setLocation("/buyer/dashboard");
      } else if (role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to impersonate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle role change confirmation
  const handleRoleChange = (
    userId: number,
    currentRole: string,
    newRole: string
  ) => {
    if (currentRole === newRole) return;

    setConfirmRoleChange({
      open: true,
      userId,
      currentRole,
      newRole,
    });
  };

  // Confirm role change
  const confirmUpdateRole = async () => {
    const { userId, newRole } = confirmRoleChange;
    if (userId !== null) {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    }
    setConfirmRoleChange({
      open: false,
      userId: null,
      currentRole: "",
      newRole: "",
    });
  };

  // Handle delete user confirmation
  const handleDeleteUser = (userId: number, username: string) => {
    setConfirmDelete({
      open: true,
      userId,
      username,
    });
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    const { userId } = confirmDelete;
    if (userId !== null) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        setConfirmDelete({
          open: false,
          userId: null,
          username: "",
        });
      } catch (error) {
        // Error handling is done in the mutation
        setConfirmDelete({
          open: false,
          userId: null,
          username: "",
        });
      }
    }
  };

  // Handle impersonate user
  const handleImpersonateUser = (
    userId: number,
    username: string,
    role: string
  ) => {
    setConfirmImpersonate({
      open: true,
      userId,
      username,
      role,
    });
  };

  // Confirm impersonation
  const confirmImpersonateUser = async () => {
    const { userId } = confirmImpersonate;
    if (userId !== null) {
      try {
        await impersonateUserMutation.mutateAsync(userId);
        setConfirmImpersonate({
          open: false,
          userId: null,
          username: "",
          role: "",
        });
      } catch (error) {
        // Error handling is done in the mutation
        setConfirmImpersonate({
          open: false,
          userId: null,
          username: "",
          role: "",
        });
      }
    }
  };

  // Filter users by search term
  const filteredUsers = users
    ?.filter((user) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => a.id - b.id);

  // Count users by role
  const roleCounts =
    users?.reduce(
      (acc, user) => {
        const role = user.role || "unknown";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Loading state for role stats
  const RoleStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {["admin", "seller", "buyer"].map((role) => (
        <Card key={role} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {role}s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Loading state for users table
  const UsersTableLoading = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="px-2 sm:px-4 md:px-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Manage users and their roles in your store
          </p>
        </div>

        {/* Role Stats */}
        {isLoading ? (
          <RoleStatsLoading />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {roleCounts["admin"] || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Sellers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {roleCounts["seller"] || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Buyers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base sm:text-lg lg:text-2xl font-bold">
                  {roleCounts["buyer"] || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        {isLoading ? (
          <UsersTableLoading />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-6 sm:pl-8 w-full h-9 sm:h-10 text-xs sm:text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  {isLoading ? (
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Link href="/admin/create-user">
                  <Button size="sm" className="text-xs sm:text-sm h-9 sm:h-10">
                    <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Add User</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 sm:w-16 lg:w-20 text-xs sm:text-sm">
                      ID
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">
                      Username
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                      Email
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                      Name
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">Role</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {user.id}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[100px] sm:max-w-[120px] lg:max-w-[200px]">
                            <div className="font-medium truncate text-xs sm:text-sm">
                              {user.username}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                          {user.name || "Not provided"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : user.role === "seller"
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                  : "bg-green-100 text-green-800 hover:bg-green-100"
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                handleRoleChange(user.id, user.role, value)
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-20 sm:w-28 h-8 text-xs">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="buyer">Buyer</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Impersonate User Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                handleImpersonateUser(
                                  user.id,
                                  user.username,
                                  user.role
                                )
                              }
                              disabled={impersonateUserMutation.isPending}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>

                            {/* Delete User Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.preventDefault(); // Prevent triggering the dialog twice
                                    handleDeleteUser(user.id, user.username);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {isError
                          ? "Error loading users. Try refreshing."
                          : search
                            ? "No users match your search."
                            : "No users found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredUsers?.length ? (
              <div className="text-xs text-muted-foreground text-right">
                Showing {filteredUsers.length} of {users?.length} users
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Role Change */}
      <AlertDialog
        open={confirmRoleChange.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRoleChange((prev) => ({ ...prev, open: false }));
          }
        }}
      >
        <AlertDialogContent className="max-w-md w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role from{" "}
              <strong>{confirmRoleChange.currentRole}</strong> to{" "}
              <strong>{confirmRoleChange.newRole}</strong>?
              <br />
              <br />
              This action will change the user's permissions and access level.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateRole}>
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Delete User */}
      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete((prev) => ({ ...prev, open: false }));
          }
        }}
      >
        <AlertDialogContent className="max-w-md w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user{" "}
              <strong>{confirmDelete.username}</strong>?
              <br />
              <br />
              This action cannot be undone. All data associated with this user
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Impersonating User */}
      <AlertDialog
        open={confirmImpersonate.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmImpersonate((prev) => ({ ...prev, open: false }));
          }
        }}
      >
        <AlertDialogContent className="max-w-md w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Impersonate User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to impersonate{" "}
              <strong>{confirmImpersonate.username}</strong> (
              {confirmImpersonate.role}).
              <br />
              <br />
              While impersonating, you will see the application as this user
              would, with their permissions and data. A banner will appear at
              the top of the screen reminding you that you're in impersonation
              mode.
              <br />
              <br />
              You can exit impersonation mode at any time by clicking the
              banner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImpersonateUser}>
              {impersonateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Impersonate User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
