import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Schema for creating a new user
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["buyer", "seller"]),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("buyer");
  const [created, setCreated] = useState(false);

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "buyer",
    },
  });

  // Update role when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue("role", value as "buyer" | "seller");
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      try {
        const res = await apiRequest("POST", "/api/users", data);

        if (!res.ok) {
          const errorData = await res.json();
          // Handle 400 error for duplicate email
          if (
            res.status === 400 &&
            errorData.error?.includes("already exists")
          ) {
            throw new Error("User with this email already exists");
          }
          throw new Error(errorData.error || "Failed to create user");
        }

        return await res.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      setCreated(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        form.reset({
          username: "",
          email: "",
          role: activeTab as "buyer" | "seller",
        });
        setCreated(false);
      }, 2000);
    },
    onError: (error: Error) => {
      // Check if it's a "User already exists" error
      if (error.message.includes("User with this email already exists")) {
        form.setError("email", {
          type: "manual",
          message: "User with this email already exists",
        });
        toast({
          title: "Email already in use",
          description:
            "A user with this email address already exists. Please use a different email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to create user",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Form submission handler
  const onSubmit = (data: CreateUserData) => {
    createUserMutation.mutateAsync(data);
  };

  // Check if email error exists
  const hasEmailError =
    form.formState.errors.email?.message?.includes("already exists");

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Create User
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Create new buyers or sellers for your store
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>
              Add a new buyer or seller to the platform. Users will use email
              OTP for authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="overflow-x-auto">
                <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 min-w-max">
                  <TabsTrigger value="buyer">Buyer</TabsTrigger>
                  <TabsTrigger value="seller">Seller</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="buyer" className="mt-0">
                <div className="mb-4">
                  <h3 className="text-base md:text-lg font-medium">
                    Create a Buyer Account
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Buyers can browse products, add items to cart, and make
                    purchases.
                  </p>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 md:space-y-6"
                  >
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                className={
                                  hasEmailError
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              User will use email OTP verification to login
                            </FormDescription>
                            <FormMessage />
                            {hasEmailError && (
                              <div className="flex items-center gap-1 text-sm font-medium text-destructive mt-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                  This email is already registered in the
                                  system.
                                </span>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input type="hidden" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending || created}
                        className="min-w-24 w-full sm:w-auto"
                      >
                        {created ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Created
                          </>
                        ) : createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Buyer"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="seller" className="mt-0">
                <div className="mb-4">
                  <h3 className="text-base md:text-lg font-medium">
                    Create a Seller Account
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sellers can list products, manage inventory, and process
                    orders.
                  </p>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
                    <strong>Note:</strong> New sellers will need approval before
                    they can start selling.
                  </div>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 md:space-y-6"
                  >
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                className={
                                  hasEmailError
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              User will use email OTP verification to login
                            </FormDescription>
                            <FormMessage />
                            {hasEmailError && (
                              <div className="flex items-center gap-1 text-sm font-medium text-destructive mt-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                  This email is already registered in the
                                  system.
                                </span>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input type="hidden" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending || created}
                        className="min-w-24 w-full sm:w-auto"
                      >
                        {created ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Created
                          </>
                        ) : createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Seller"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 md:mt-6 space-y-2">
          <div className="text-sm text-muted-foreground">
            <p>Users will be created with a basic account.</p>
            <p>
              They will use email OTP verification to login - no password is
              required.
            </p>
            <p>
              Sellers will need to be approved before they can access seller
              features.
            </p>
          </div>

          {hasEmailError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              <strong>Error:</strong> A user with this email already exists in
              the system. Please try with a different email address.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
