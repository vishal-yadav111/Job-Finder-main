// Centralized Workspace Base Connection Protocol Constants
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:8000";

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
    const response = await fetch(`${API_BASE}/auth/register`, {
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
    const response = await fetch(`${API_BASE}/scan/start`, {
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
    const response = await fetch(`${API_BASE}/scan/stop`, {
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

    const response = await fetch(`${API_BASE}/jobs/feed?${queryParams}`, {
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
    const response = await fetch(`${API_BASE}/auth/login`, {
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