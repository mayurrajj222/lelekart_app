import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Types
interface WalletTransaction {
  id: number;
  userId: number;
  amount: number;
  type: "credit" | "debit" | "expired";
  description: string;
  createdAt: string;
  expiresAt: string | null;
}

interface Wallet {
  id: number;
  userId: number;
  balance: number;
  redeemedBalance: number; // Redeemed coins left
}

interface WalletSettings {
  id?: number;
  firstPurchaseCoins: number;
  expiryDays: number;
  conversionRate: number;
  maxUsagePercentage: number;
  minCartValue: number;
  applicableCategories: string;
  isActive: boolean;
}

type RedeemCoinsOptions = {
  referenceType?: string;
  referenceId?: number;
  description?: string;
  orderValue?: number;
  category?: string;
};

// Context interface
type WalletContextType = {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  settings: WalletSettings | null;
  isLoading: boolean;
  isSettingsLoading: boolean;
  isTransactionsLoading: boolean;
  redeemCoins: (amount: number, options?: RedeemCoinsOptions) => Promise<void>;
  refetchWallet: () => void;
  refetchTransactions: () => void;
};

// Default values for context
const defaultWalletContext: WalletContextType = {
  wallet: null,
  transactions: [],
  settings: null,
  isLoading: false,
  isSettingsLoading: false,
  isTransactionsLoading: false,
  redeemCoins: async () => {},
  refetchWallet: () => {},
  refetchTransactions: () => {},
};

// Create context with default values
const WalletContext = createContext<WalletContextType>(defaultWalletContext);

// Helper to check if route is public
function isPublicRoute(path: string): boolean {
  return path.startsWith('/search') || path.startsWith('/seller/public-profile');
}

// The main provider component that decides which provider to use
export function WalletProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Always declare all hooks regardless of conditionals
  const {
    data: wallet = null,
    isLoading: isWalletLoading,
    refetch: refetchWallet
  } = useQuery({
    queryKey: ['/api/wallet'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/wallet', { 
          method: 'GET',
          credentials: 'include',
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          }
        });
        
        if (!res.ok) {
          if (res.status === 404 || res.status === 401) {
            // Handle auth errors silently with no console warning
            return null;
          }
          throw new Error('Failed to fetch wallet data');
        }
        const data = await res.json();
        // Ensure redeemedBalance is present
        if (data && typeof data.redeemedBalance !== 'number') data.redeemedBalance = 0;
        return data;
      } catch (error) {
        // Only log the error if it's not an auth issue
        if (error instanceof Error && !error.message.includes("Failed to fetch")) {
          console.error('Error fetching wallet:', error);
        }
        return null;
      }
    },
    // Disable the query for public routes
    enabled: !isPublicRoute(location),
    // Don't retry on 401 errors
    retry: false,
    // Increased staleTime to reduce number of requests
    staleTime: 60 * 1000 // 1 minute
  });

  // Get wallet transactions
  const {
    data: transactionsData = { transactions: [], total: 0 },
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/wallet/transactions', { 
          method: 'GET',
          credentials: 'include',
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          }
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            // Handle auth errors silently with no console warning
            return { transactions: [], total: 0 };
          }
          throw new Error('Failed to fetch wallet transactions');
        }
        const data = await res.json();
        // Handle different API response formats
        if (Array.isArray(data)) {
          return { transactions: data, total: data.length };
        } else if (data.transactions && Array.isArray(data.transactions)) {
          return data; // Already in the correct format { transactions: [], total: number }
        } else if (typeof data === 'object' && data !== null) {
          // Try to convert to expected format
          return { 
            transactions: Array.isArray(data.transactions) ? data.transactions : [], 
            total: data.total || 0 
          };
        }
        // Fallback to empty state if data is in unexpected format
        return { transactions: [], total: 0 };
      } catch (error) {
        // Only log the error if it's not an auth issue
        if (error instanceof Error && !error.message.includes("Failed to fetch")) {
          console.error('Error fetching transactions:', error);
        }
        return { transactions: [], total: 0 };
      }
    },
    // Disable the query for public routes
    enabled: !isPublicRoute(location),
    // Don't retry on error
    retry: false,
    // Increased staleTime to reduce number of requests
    staleTime: 60 * 1000 // 1 minute
  });

  // Get wallet settings
  const {
    data: rawSettings = null,
    isLoading: isSettingsLoading,
  } = useQuery({
    queryKey: ['/api/wallet/settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/wallet/settings', {
          method: 'GET',
          credentials: 'include',
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          }
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            // Handle auth errors silently with no console warning
            return null;
          }
          throw new Error('Failed to fetch wallet settings');
        }
        return res.json();
      } catch (error) {
        // Only log the error if it's not an auth issue
        if (error instanceof Error && !error.message.includes("Failed to fetch")) {
          console.error('Error fetching wallet settings:', error);
        }
        return null;
      }
    },
    // Settings can be fetched regardless of route as they're public information
    staleTime: 300 * 1000, // 5 minutes
    retry: false
  });
  
  // Map server field names to client field names
  const settings = rawSettings ? {
    ...rawSettings,
    isActive: rawSettings.isEnabled,
    conversionRate: Number(rawSettings.coinToCurrencyRatio),
    expiryDays: Number(rawSettings.coinExpiryDays),
    maxUsagePercentage: Number(rawSettings.maxUsagePercentage || 0),
    minCartValue: Number(rawSettings.minCartValue || 0)
  } : null;

  // Redeem coins mutation
  const redeemCoinsMutation = useMutation({
    mutationFn: async (params: {
      amount: number;
    } & RedeemCoinsOptions) => {
      try {
        const res = await fetch('/api/wallet/redeem', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
          body: JSON.stringify(params)
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          }
          
          const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || 'Failed to redeem coins');
        }
        return res.json();
      } catch (error) {
        console.error('Error redeeming coins:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Coins Redeemed",
        description: "Your coins have been successfully redeemed",
      });
      refetchWallet();
      refetchTransactions();
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const redeemCoins = async (amount: number, options?: RedeemCoinsOptions) => {
    return await redeemCoinsMutation.mutateAsync({
      amount,
      ...options
    });
  };

  const transactions = transactionsData?.transactions || [];
  
  // For public routes, provide default context
  if (isPublicRoute(location)) {
    return (
      <WalletContext.Provider value={defaultWalletContext}>
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        settings,
        isLoading: isWalletLoading,
        isTransactionsLoading,
        isSettingsLoading,
        redeemCoins,
        refetchWallet,
        refetchTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  return context;
}