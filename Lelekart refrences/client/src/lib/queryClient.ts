import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string> }
): Promise<Response> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    ...(options?.headers || {})
  };
  
  let body: string | FormData | undefined = undefined;
  
  if (data) {
    if (data instanceof FormData) {
      // Let the browser set the Content-Type with boundary for FormData
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: body,
    credentials: "include",
    cache: "no-store",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      cache: "no-store",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // Enable refetching when window gets focus
      refetchOnMount: true,        // Always refetch on component mount
      staleTime: 0,                // Always consider data stale for product-related queries
      retry: false,
    },
    mutations: {
      retry: false,
      // Ensure cache is invalidated after mutations to keep data fresh
      onSuccess: (_data: unknown, _variables: unknown, _context: unknown) => {
        // Note: We don't use the mutation meta pattern here because it's handled explicitly in each
        // component's mutation. This is kept here as a placeholder for potential future needs.
      },
    },
  },
});
