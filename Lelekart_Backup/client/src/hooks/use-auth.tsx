import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Types for OTP authentication
type RequestOtpData = {
  email: string;
};

type VerifyOtpData = {
  email: string;
  otp: string;
};

type RegisterData = {
  username: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
};

type OtpVerifyResponse = {
  user?: SelectUser;
  isNewUser: boolean;
  email?: string;
  message: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  requestOtpMutation: UseMutationResult<{ message: string; email: string; expiresIn: number }, Error, RequestOtpData>;
  verifyOtpMutation: UseMutationResult<OtpVerifyResponse, Error, VerifyOtpData>;
  registerMutation: UseMutationResult<{ user: SelectUser; message: string }, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Request OTP Mutation
  const requestOtpMutation = useMutation({
    mutationFn: async (data: RequestOtpData) => {
      const response = await apiRequest("POST", "/api/auth/request-otp", data);
      return await response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  // Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpData) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (!data.isNewUser && data.user) {
        // If existing user, set the user data and trigger refetch
        queryClient.setQueryData(["/api/user"], data.user);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    },
  });

  // Register Mutation for new users
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const contextValue = {
    user: user ?? null,
    isLoading,
    error,
    requestOtpMutation,
    verifyOtpMutation,
    registerMutation,
    logoutMutation,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
