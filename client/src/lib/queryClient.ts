import { QueryClient } from '@tanstack/react-query';

// Global auth headers state - this will be updated by the AuthProvider
let authHeaders: Record<string, string> = {};

// Function to set authentication headers globally
export const setAuthHeaders = (headers: Record<string, string>) => {
  authHeaders = headers;
};

// Function to get current auth headers
export const getAuthHeaders = () => ({ ...authHeaders });

// Helper to get authenticated headers
const getAuthenticatedHeaders = (additionalHeaders: Record<string, string> = {}) => {
  // In development mode, add the dev secret for seeded user authentication
  const devHeaders: Record<string, string> = {};
  if (import.meta.env.DEV && authHeaders['x-user-id']) {
    devHeaders['x-dev-secret'] = 'local-dev-only-2024';
  }
  
  return {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...devHeaders,
    ...additionalHeaders,
  };
};

// Create the query client instance (this will be used by components that need direct access)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      queryFn: async ({ queryKey }) => {
        const [url, params] = queryKey as [string, Record<string, any>?];
        
        const urlObj = new URL(url, window.location.origin);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              urlObj.searchParams.set(key, String(value));
            }
          });
        }
        
        const response = await fetch(urlObj.toString(), {
          credentials: 'include', // Include session cookies for authentication
          headers: getAuthenticatedHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

// API request helper for mutations - supports both old and new signatures
export const apiRequest = async (
  url: string,
  methodOrOptions?: string | RequestInit,
  data?: any,
  options: RequestInit = {}
) => {
  let requestOptions: RequestInit;

  // Backward compatibility: detect if second param is RequestInit (old signature)
  if (typeof methodOrOptions === 'object' && methodOrOptions !== null) {
    // Old signature: apiRequest(url, {method: 'POST', body: ...})
    requestOptions = {
      ...methodOrOptions,
      headers: getAuthenticatedHeaders(methodOrOptions.headers as Record<string, string>),
    };
  } else {
    // New signature: apiRequest(url, 'POST', data, options)
    const method = (methodOrOptions as string | undefined) || 'GET';
    requestOptions = {
      ...options,
      method,
      headers: getAuthenticatedHeaders(options.headers as Record<string, string>),
    };

    // Auto-serialize JSON data for POST/PATCH/DELETE
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, {
    ...requestOptions,
    credentials: 'include', // Include session cookies for authentication
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};