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
): Promise<Response> {
  const cacheBustUrl = url.includes('?') 
    ? `${url}&_t=${Date.now()}` 
    : `${url}?_t=${Date.now()}`;
  
  const res = await fetch(cacheBustUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
    body: data ? JSON.stringify(data) : undefined,
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
    const url = queryKey.join("/") as string;
    const cacheBustUrl = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    const res = await fetch(cacheBustUrl, {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
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
      refetchInterval: 60000,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
