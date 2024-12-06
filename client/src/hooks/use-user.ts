import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, {
      method,
      headers: body ? { 
        "Content-Type": "application/json",
      } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    
    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      const errorMessage = isJson ? errorData.message : errorData;
      
      if (response.status >= 500) {
        console.error('Server error:', errorMessage);
        return { ok: false, message: "Internal server error. Please try again later." };
      }

      console.error('Request failed:', errorMessage);
      return { ok: false, message: errorMessage };
    }

    const data = isJson ? await response.json() : await response.text();
    console.log('Request successful:', data);
    return { ok: true };
  } catch (e: any) {
    console.error('Request error:', e);
    return { ok: false, message: "Network error. Please check your connection." };
  }
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/user', {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.clear(); // Clear all queries and cache
      queryClient.resetQueries(); // Reset all queries to their initial state
      window.location.href = '/'; // Force a full page reload to clear all state
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
