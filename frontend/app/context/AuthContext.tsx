"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../lib/api";
import { WS_BASE } from "../lib/api"; 
interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const access = localStorage.getItem("access_token");
    if (access) setAccessToken(access);
    setIsLoading(false);
  }, []);

  const login = (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setAccessToken(access);
    router.replace("/jobs");
  };

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    router.replace("/login");
  }, [router]);

  // Requirement 7: interceptor that handles automated token refresh rotation transparency
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    let currentAccess = localStorage.getItem("access_token");
    
    options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${currentAccess}`,
    };

    let response = await fetch(url, options);

    // If access token has expired, kick off the single-use rotation handshake
    if (response.status === 401) {
      const currentRefresh = localStorage.getItem("refresh_token");
      if (!currentRefresh) {
        logout();
        throw new Error("Missing credentials for rotation verification context");
      }

      try {
        // FIXED: Consumes the centralized exported API_BASE variable below
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: currentRefresh }),
        });

        if (!refreshResponse.ok) throw new Error("Refresh token expired or invalid");

        const tokens = await refreshResponse.json();
        
        // Update browser storage layers instantly
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        setAccessToken(tokens.access_token);

        // Requirement 7: Retry failed request with fresh access token
        options.headers = {
          ...options.headers,
          "Authorization": `Bearer ${tokens.access_token}`,
        };
        response = await fetch(url, options);
      } catch (err) {
        logout();
        throw new Error("Auth rotation challenge failed");
      }
    }

    return response;
  }, [logout]);

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated: !!accessToken, isLoading, login, logout, authenticatedFetch }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be wrapping clean layout context blocks");
  return context;
};

// Centralized Workspace Base Connection Protocol Constants


// Kept parallel string matching for old code execution references
const API_BASE_URL = API_BASE;

/**
 * Normalized interface to guarantee safe operations without crashing UI threads
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: string;
  running?: boolean;
}

/**
 * Safely registers a fresh workspace identity account profile
 */
export async function registerUser(payload: Record<string, string>): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Registration rejected. Account identity might already exist.");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("API Error [registerUser]:", error);
    return { success: false, error: error.message || "Connection failure to security registry server" };
  }
}

/**
 * Dispatches an engine command to start background scraping loops
 */
export async function startScan(): Promise<ApiResponse> {
  try {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const response = await fetch(`${API_BASE_URL}/scan/start`, {
      method: "POST",
      headers: {
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) throw new Error(`Server returned error code status: ${response.status}`);
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    console.error("API Error [startScan]:", error);
    return { success: false, error: error.message || "Failed to issue engine startup commands" };
  }
}

/**
 * Dispatches an engine command to halt active background scraping loops
 */
export async function stopScan(): Promise<ApiResponse> {
  try {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const response = await fetch(`${API_BASE_URL}/scan/stop`, {
      method: "POST",
      headers: {
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) throw new Error(`Server returned error code status: ${response.status}`);
    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    console.error("API Error [stopScan]:", error);
    return { success: false, error: error.message || "Failed to issue engine termination sequence" };
  }
}

/**
 * STRICT REQUIREMENT: Interacts directly with the fast Redis storage cache timeline feed view
 */
export async function fetchJobsFeed(search: string = ""): Promise<ApiResponse> {
  try {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const queryParams = new URLSearchParams({
      ...(search && { search }),
    });

    const response = await fetch(`${API_BASE_URL}/jobs/feed?${queryParams}`, {
      method: "GET",
      headers: {
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) throw new Error("Failed fetching pipeline positions from fast cache feed");
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("API Error [fetchJobsFeed]:", error);
    return { success: false, error: error.message || "Could not synchronize with active Redis timeline cache layers" };
  }
}

/**
 * Safely authenticates user credentials with the backend identity router
 */
export async function loginUser(payload: Record<string, string>): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 404 || response.status === 401) {
      throw new Error("Invalid username or password combination.");
    }
    if (!response.ok) {
      throw new Error(`Server returned unexpected error state (Code: ${response.status})`);
    }

    const data = await response.json();
    
    // Explicit schema validation check
    if (!data || !data.access_token || !data.refresh_token) {
      throw new Error("Malformed security credentials payload dropped by host server.");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("API Error [loginUser]:", error);
    return { success: false, error: error.message || "Connection failure: Remote core target host unreachable." };
  }
}