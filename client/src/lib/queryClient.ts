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
  return {
    'Content-Type': 'application/json',
    ...authHeaders,
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

// API request helper for mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: getAuthenticatedHeaders(options.headers as Record<string, string>),
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};